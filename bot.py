#!/usr/bin/env python3
"""
Telegram Bot for "Дія" PWA per-user GitHub JSON database.
Provides user management commands (/start, /set, /get, /reset, /link)
and synchronizes with users/{telegram_user_id}.json on GitHub.
"""

import os
import sys
import json
import base64
import logging
from typing import Optional, Tuple, Dict, Any

import requests
from telegram import Update
from telegram.ext import (
    Application,
    CommandHandler,
    ContextTypes,
)

# Configuration from environment
BOT_TOKEN = os.getenv("BOT_TOKEN", "")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
GITHUB_REPO = os.getenv("GITHUB_REPO", "")  # e.g., "owner/repo"
PWA_URL = os.getenv("PWA_URL", "http://localhost:3000").rstrip("/")

# Supported schema fields according to CARD_CONFIGS
SCHEMA_FIELDS = [
    "name",
    "nameEn",
    "birthDate",
    "rnokpp",
    "nomerPasport",
    "sex",
    "dateGive",
    "dateOut",
    "organ",
    "uznr",
    "placeBirth",
    "legalAdress",
    "zagran_number",
    "pravaNnumber",
    "rightsCategories",
    "nomerStudy",
    "university",
    "zbroyaNumber",
    "mainPhoto",
]

# Field labels for display
FIELD_LABELS = {
    "name": "ПІБ (укр.)",
    "nameEn": "ПІБ (англ.)",
    "birthDate": "Дата народження",
    "rnokpp": "РНОКПП",
    "nomerPasport": "Номер паспорта",
    "sex": "Стать",
    "dateGive": "Дата видачі",
    "dateOut": "Дійсний до",
    "organ": "Орган видачі",
    "uznr": "УНЗР",
    "placeBirth": "Місце народження",
    "legalAdress": "Зареєстроване місце проживання",
    "zagran_number": "Номер закордонного паспорта",
    "pravaNnumber": "Номер посвідчення водія",
    "rightsCategories": "Категорії водія",
    "nomerStudy": "Номер студентського квитка",
    "university": "Заклад вищої освіти",
    "zbroyaNumber": "Номер дозволу на зброю",
    "mainPhoto": "Фото (base64 / URL)",
}

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)


def get_default_user_data(user_id: int) -> Dict[str, Any]:
    """Return default empty schema for a new user."""
    data = {field: "" for field in SCHEMA_FIELDS}
    data["userId"] = str(user_id)
    return data


def github_headers() -> Dict[str, str]:
    """Headers for GitHub API requests."""
    return {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Diya-Telegram-Bot",
    }


def get_github_file(user_id: int) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """
    Fetch users/{user_id}.json from GitHub.
    Returns (data_dict, sha) or (None, None) if not found.
    """
    if not GITHUB_TOKEN or not GITHUB_REPO:
        logger.warning("GITHUB_TOKEN or GITHUB_REPO not configured")
        return None, None

    url = f"https://api.github.com/repos/{GITHUB_REPO}/contents/users/{user_id}.json"
    try:
        res = requests.get(url, headers=github_headers(), timeout=10)
        if res.status_code == 200:
            payload = res.json()
            content_b64 = payload.get("content", "")
            sha = payload.get("sha")
            decoded = base64.b64decode(content_b64).decode("utf-8")
            return json.loads(decoded), sha
        elif res.status_code == 404:
            return None, None
        else:
            logger.error("GitHub API error (%d): %s", res.status_code, res.text)
            return None, None
    except Exception as e:
        logger.error("Exception fetching from GitHub: %s", e)
        return None, None


def save_github_file(user_id: int, data: Dict[str, Any], sha: Optional[str], message: str) -> bool:
    """
    Write users/{user_id}.json to GitHub.
    """
    if not GITHUB_TOKEN or not GITHUB_REPO:
        logger.warning("GITHUB_TOKEN or GITHUB_REPO not configured")
        return False

    url = f"https://api.github.com/repos/{GITHUB_REPO}/contents/users/{user_id}.json"
    json_bytes = json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")
    content_b64 = base64.b64encode(json_bytes).decode("utf-8")

    body: Dict[str, Any] = {
        "message": message,
        "content": content_b64,
    }
    if sha:
        body["sha"] = sha

    try:
        res = requests.put(url, headers=github_headers(), json=body, timeout=10)
        if res.status_code in (200, 201):
            return True
        else:
            logger.error("GitHub API error on save (%d): %s", res.status_code, res.text)
            return False
    except Exception as e:
        logger.error("Exception saving to GitHub: %s", e)
        return False


# ─── Bot Handlers ─────────────────────────────────────────────────────────────

async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """
    /start — initialize user data in GitHub repository if not present.
    """
    if not update.effective_user or not update.message:
        return

    user_id = update.effective_user.id
    data, sha = get_github_file(user_id)

    if data is None:
        new_data = get_default_user_data(user_id)
        saved = save_github_file(user_id, new_data, None, f"Initialize user {user_id}")
        if saved:
            msg = (
                f"👋 Вітаємо в системі «Дія»!\n\n"
                f"Створено профіль для ID: <code>{user_id}</code>.\n\n"
                f"Команди:\n"
                f"• /link — посилання на вашу веб-версію Дія\n"
                f"• /set <i>поле</i> <i>значення</i> — встановити поле\n"
                f"• /get — переглянути поточні дані\n"
                f"• /reset — скинути всі поля"
            )
        else:
            msg = (
                f"⚠️ Помилка з'єднання з GitHub API під час створення профілю.\n"
                f"Перевірте налаштування GITHUB_TOKEN та GITHUB_REPO."
            )
    else:
        msg = (
            f"👋 З поверненням!\n"
            f"Ваш профіль <code>{user_id}</code> уже підключено.\n\n"
            f"• /link — відкрити Дію\n"
            f"• /get — переглянути дані\n"
            f"• /set <i>поле</i> <i>значення</i> — оновити дані"
        )

    await update.message.reply_html(msg)


async def cmd_link(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """
    /link — send individual PWA link with user id query param.
    """
    if not update.effective_user or not update.message:
        return

    user_id = update.effective_user.id
    pwa_link = f"{PWA_URL}/?uid={user_id}"

    msg = (
        f"📱 <b>Ваша цифрова Дія:</b>\n\n"
        f"<a href=\"{pwa_link}\">{pwa_link}</a>\n\n"
        f"<i>Відкрийте посилання у браузері або додайте на головний екран як PWA.</i>"
    )
    await update.message.reply_html(msg, disable_web_page_preview=False)


async def cmd_set(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """
    /set field value — update a single field.
    Example: /set name Шевченко Тарас Григорович
    """
    if not update.effective_user or not update.message:
        return

    user_id = update.effective_user.id
    args = context.args

    if not args or len(args) < 2:
        fields_list = "\n".join([f"• <code>{f}</code> ({FIELD_LABELS.get(f, f)})" for f in SCHEMA_FIELDS])
        await update.message.reply_html(
            f"Формат команди:\n<code>/set поле значення</code>\n\n"
            f"Приклад:\n<code>/set name Іваненко Петро Васильович</code>\n\n"
            f"Доступні поля:\n{fields_list}"
        )
        return

    field = args[0]
    value = " ".join(args[1:])

    if field not in SCHEMA_FIELDS:
        await update.message.reply_html(
            f"❌ Невідоме поле <code>{field}</code>.\n"
            f"Використовуйте /set без параметрів, щоб переглянути список доступних полів."
        )
        return

    data, sha = get_github_file(user_id)
    if data is None:
        data = get_default_user_data(user_id)

    data[field] = value
    commit_msg = f"Update user {user_id}: set {field}"
    success = save_github_file(user_id, data, sha, commit_msg)

    if success:
        label = FIELD_LABELS.get(field, field)
        await update.message.reply_html(
            f"✅ <b>Оновлено:</b> {label}\n"
            f"<code>{field}</code> = <b>{value}</b>\n\n"
            f"<i>Зміни синхронізуються у вашому додатку Дія автоматично.</i>"
        )
    else:
        await update.message.reply_html(
            f"⚠️ Помилка збереження на GitHub. Перевірте логи та права доступу токена."
        )


async def cmd_get(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """
    /get — show current user data formatted.
    """
    if not update.effective_user or not update.message:
        return

    user_id = update.effective_user.id
    data, _ = get_github_file(user_id)

    if not data:
        await update.message.reply_html(
            f"ℹ️ Для вашого ID <code>{user_id}</code> ще немає збережених даних.\n"
            f"Використайте /start для ініціалізації або /set для заповнення полів."
        )
        return

    lines = [f"📋 <b>Дані користувача {user_id}:</b>\n"]
    for field in SCHEMA_FIELDS:
        val = data.get(field, "")
        label = FIELD_LABELS.get(field, field)
        if field == "mainPhoto" and len(val) > 60:
            val_display = f"[Base64 Image: {len(val)} chars]"
        else:
            val_display = val if val else "<i>(порожньо)</i>"
        lines.append(f"• <b>{label}</b> (<code>{field}</code>):\n   {val_display}")

    await update.message.reply_html("\n".join(lines))


async def cmd_reset(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """
    /reset — reset user data to empty schema.
    """
    if not update.effective_user or not update.message:
        return

    user_id = update.effective_user.id
    _, sha = get_github_file(user_id)

    new_data = get_default_user_data(user_id)
    success = save_github_file(user_id, new_data, sha, f"Reset user {user_id}")

    if success:
        await update.message.reply_html(
            f"🔄 <b>Дані успішно скинуто!</b>\n"
            f"Всі поля для ID <code>{user_id}</code> очищено."
        )
    else:
        await update.message.reply_html(
            f"⚠️ Помилка під час скидання даних на GitHub."
        )


def main() -> None:
    """Start the Telegram bot."""
    if not BOT_TOKEN:
        print("Error: BOT_TOKEN environment variable is not set.", file=sys.stderr)
        sys.exit(1)

    app = Application.builder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("link", cmd_link))
    app.add_handler(CommandHandler("set", cmd_set))
    app.add_handler(CommandHandler("get", cmd_get))
    app.add_handler(CommandHandler("reset", cmd_reset))

    logger.info("Bot starting polling...")
    app.run_polling()


if __name__ == "__main__":
    main()
