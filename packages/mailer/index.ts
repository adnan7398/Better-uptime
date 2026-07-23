import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

type MonitorInfo = {
    id: string;
    url: string;
    name: string | null;
};

export async function sendDownAlert(to: string[], monitor: MonitorInfo, checkedAt: string) {
    if (to.length === 0) return;

    await resend.emails.send({
        from: FROM,
        to,
        subject: `\u{1F534} ${monitor.name || monitor.url} is down`,
        html: `<p><strong>${monitor.name || monitor.url}</strong> (${monitor.url}) failed a check at ${checkedAt}.</p>`
    });
}

export async function sendRecoveryAlert(to: string[], monitor: MonitorInfo, checkedAt: string) {
    if (to.length === 0) return;

    await resend.emails.send({
        from: FROM,
        to,
        subject: `\u{1F7E2} ${monitor.name || monitor.url} is back up`,
        html: `<p><strong>${monitor.name || monitor.url}</strong> (${monitor.url}) recovered at ${checkedAt}.</p>`
    });
}
