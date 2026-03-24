const KLAVIYO_COMPANY_ID = "XEPXRf";
const KLAVIYO_CLIENT_EVENTS_URL = `https://a.klaviyo.com/client/events/?company_id=${KLAVIYO_COMPANY_ID}`;
const KLAVIYO_REVISION = "2024-10-15";

interface TrackEventOptions {
  email: string;
  metricName: string;
  properties: Record<string, unknown>;
  firstName?: string;
  profileProperties?: Record<string, unknown>;
}

export async function trackKlaviyoEvent(opts: TrackEventOptions): Promise<boolean> {
  const { email, metricName, properties, firstName, profileProperties } = opts;

  const profileAttributes: Record<string, unknown> = { email };
  if (firstName) profileAttributes.first_name = firstName;
  if (profileProperties) profileAttributes.properties = profileProperties;

  const payload = {
    data: {
      type: "event",
      attributes: {
        profile: { data: { type: "profile", attributes: profileAttributes } },
        metric: { data: { type: "metric", attributes: { name: metricName } } },
        properties,
        time: new Date().toISOString(),
        unique_id: `${metricName.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      },
    },
  };

  try {
    const res = await fetch(KLAVIYO_CLIENT_EVENTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", revision: KLAVIYO_REVISION },
      body: JSON.stringify(payload),
    });
    if (res.ok || res.status === 202) {
      console.log(`[klaviyoTrack] '${metricName}' tracked for ${email}`);
      return true;
    }
    const body = await res.text();
    console.warn(`[klaviyoTrack] '${metricName}' failed (${res.status}): ${body.substring(0, 300)}`);
    return false;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[klaviyoTrack] '${metricName}' exception: ${message}`);
    return false;
  }
}
