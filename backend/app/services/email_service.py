import aiosmtplib
from email.message import EmailMessage
from html import escape

from app.config import settings


async def send_temp_password_email(
    recipient_email: str,
    user_name: str,
    temp_password: str,
) -> None:
    message = EmailMessage()
    message["From"] = f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM_ADDRESS}>"
    message["To"] = recipient_email
    message["Subject"] = "NC Performance Dashboard - Your Temporary Password"

    safe_name = escape(user_name)
    safe_password = escape(temp_password)
    html_body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #111827;">
        <h2>NC Performance Dashboard</h2>
        <p>Hello {safe_name},</p>
        <p>Your temporary password is:</p>
        <p style="font-size: 20px; font-weight: 700; letter-spacing: 1px;">{safe_password}</p>
        <p>Please log in with your DAO code or email address, then change this password immediately.</p>
        <p>This temporary password is valid for {settings.TEMP_PASSWORD_EXPIRES_HOURS} hours.</p>
      </body>
    </html>
    """
    text_body = (
        f"Hello {user_name},\n\n"
        f"Your temporary password is: {temp_password}\n\n"
        "Please log in with your DAO code or email address, then change this password immediately.\n"
    )
    message.set_content(text_body)
    message.add_alternative(html_body, subtype="html")

    await aiosmtplib.send(
        message,
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USERNAME,
        password=settings.SMTP_PASSWORD,
        start_tls=settings.SMTP_USE_TLS,
    )
