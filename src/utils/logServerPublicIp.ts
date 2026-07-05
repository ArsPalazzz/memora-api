import type { Logger } from 'winston';

const LOOKUP_TIMEOUT_MS = 5000;

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function logServerPublicIp(logger: Logger): Promise<void> {
  try {
    const response = await fetchWithTimeout('https://ipapi.co/json/');

    if (response.ok) {
      const data = (await response.json()) as {
        ip?: string;
        country_name?: string;
        country_code?: string;
        city?: string;
      };

      if (data.ip) {
        const location = [data.city, data.country_name ?? data.country_code]
          .filter(Boolean)
          .join(', ');

        logger.info(
          location
            ? `🌍 Server public IP: ${data.ip} (${location})`
            : `🌍 Server public IP: ${data.ip}`
        );
        return;
      }
    }
  } catch {
    // Fall back to IP-only lookup below.
  }

  try {
    const response = await fetchWithTimeout('https://api.ipify.org?format=json');

    if (!response.ok) {
      throw new Error(`ipify responded with ${response.status}`);
    }

    const data = (await response.json()) as { ip?: string };

    if (data.ip) {
      logger.info(`🌍 Server public IP: ${data.ip}`);
      return;
    }

    throw new Error('ipify response did not include an IP');
  } catch (error) {
    logger.warn('Could not determine server public IP', { error });
  }
}
