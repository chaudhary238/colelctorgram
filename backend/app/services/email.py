"""Transactional email via Resend (B-71).

The ONE non-cuttable middleman (see LAUNCH_PLAN.md) — deliverability is sender
reputation and can't be self-hosted. Free tier (3k emails/mo, 100/day) covers
the entire closed beta.

Behaviour without RESEND_API_KEY: logs the email instead of sending, so local
dev works with zero setup. Note: until a sending domain is verified in Resend,
the default `onboarding@resend.dev` sender can only deliver to the Resend
account owner's own email address — enough for self-testing.
"""
import logging

import httpx

from app.config import settings

logger = logging.getLogger("collectorhub.email")

RESEND_URL = "https://api.resend.com/emails"


async def send_email(to: str, subject: str, html: str) -> bool:
    """Send one email. Never raises — failures are logged and return False."""
    if not settings.resend_api_key:
        logger.info("email NOT sent (RESEND_API_KEY unset) to=%s subject=%r", to, subject)
        return False
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                RESEND_URL,
                headers={"Authorization": f"Bearer {settings.resend_api_key}"},
                json={
                    "from": settings.email_from,
                    "to": [to],
                    "subject": subject,
                    "html": html,
                },
            )
            resp.raise_for_status()
        logger.info("email sent to=%s subject=%r", to, subject)
        return True
    except Exception:
        logger.exception("email send FAILED to=%s subject=%r", to, subject)
        return False


async def send_otp_email(to: str, code: str) -> bool:
    """Signup confirmation code (DF-06 / B-72)."""
    html = f"""
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:420px;margin:0 auto;padding:24px">
      <h2 style="color:#14110F;margin:0 0 8px">Confirm your email</h2>
      <p style="color:#5C544C;font-size:15px;line-height:1.5;margin:0 0 20px">
        Enter this code in CollectorHub to confirm your account. It expires in 10 minutes.
      </p>
      <div style="font-family:ui-monospace,monospace;font-size:32px;font-weight:700;letter-spacing:6px;
                  color:#14110F;background:#F4EFE6;border-radius:12px;padding:16px;text-align:center">
        {code}
      </div>
      <p style="color:#8B8178;font-size:12.5px;margin:20px 0 0">
        Didn't create a CollectorHub account? You can safely ignore this email.
      </p>
    </div>
    """
    return await send_email(to, f"{code} is your CollectorHub code", html)


async def send_password_reset_email(to: str, reset_url: str) -> bool:
    """Password-reset link (B-71 / DF-37a)."""
    html = f"""
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:420px;margin:0 auto;padding:24px">
      <h2 style="color:#14110F;margin:0 0 8px">Reset your password</h2>
      <p style="color:#5C544C;font-size:15px;line-height:1.5;margin:0 0 20px">
        Tap the button below to choose a new password. This link expires in 15 minutes.
      </p>
      <a href="{reset_url}" style="display:inline-block;background:#FF2442;color:#fff;text-decoration:none;
                  font-weight:700;font-size:15px;border-radius:12px;padding:13px 22px">
        Reset password
      </a>
      <p style="color:#8B8178;font-size:12.5px;margin:20px 0 0">
        Didn't request this? You can safely ignore this email — your password won't change.
      </p>
    </div>
    """
    return await send_email(to, "Reset your CollectorHub password", html)
