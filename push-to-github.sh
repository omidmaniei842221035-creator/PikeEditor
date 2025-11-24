#!/bin/bash

# رنگ‌ها برای خروجی
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== راهنمای Push به GitHub ===${NC}"
echo ""
echo "این اسکریپت به شما کمک می‌کند پروژه را به GitHub push کنید."
echo ""

# درخواست Token
echo -e "${YELLOW}مرحله 1: GitHub Token${NC}"
echo "برای ساخت token برو به: https://github.com/settings/tokens"
echo "و یک token با scope 'repo' بساز."
echo ""
read -p "GitHub Token خود را وارد کنید: " GITHUB_TOKEN
echo ""

if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${RED}❌ Token وارد نشده!${NC}"
    exit 1
fi

# Repository URL
REPO_URL="https://github.com/omidmaniei842221035-creator/pos-monitoring.git"
REPO_URL_WITH_TOKEN="https://${GITHUB_TOKEN}@github.com/omidmaniei842221035-creator/pos-monitoring.git"

echo -e "${GREEN}✓ Token دریافت شد${NC}"
echo ""

# چک کردن git status
echo -e "${YELLOW}مرحله 2: بررسی وضعیت Git${NC}"
git status > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠ Git repository وجود ندارد. Initialize می‌کنیم...${NC}"
    git init
    echo -e "${GREEN}✓ Git initialized${NC}"
fi

# حذف remote قدیمی (اگر وجود دارد)
echo ""
echo -e "${YELLOW}مرحله 3: تنظیم Remote${NC}"
git remote remove origin 2>/dev/null
echo -e "${GREEN}✓ Remote قدیمی حذف شد (اگر وجود داشت)${NC}"

# اضافه کردن remote جدید
git remote add origin "$REPO_URL_WITH_TOKEN"
echo -e "${GREEN}✓ Remote جدید اضافه شد${NC}"

# Add همه فایل‌ها
echo ""
echo -e "${YELLOW}مرحله 4: Add کردن فایل‌ها${NC}"
git add .
echo -e "${GREEN}✓ همه فایل‌ها add شدند${NC}"

# Commit
echo ""
echo -e "${YELLOW}مرحله 5: Commit${NC}"
git commit -m "Initial commit: POS Monitoring System - Complete Web & Desktop Application" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Commit موفق${NC}"
else
    echo -e "${YELLOW}⚠ ممکن است تغییری برای commit نباشد یا قبلاً commit شده باشد${NC}"
fi

# تلاش برای rename branch
echo ""
echo -e "${YELLOW}مرحله 6: تنظیم Branch به main${NC}"
git branch -M main 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Branch به main تغییر یافت${NC}"
else
    echo -e "${YELLOW}⚠ نتوانستیم branch را rename کنیم (ممکن است Replit مسدود کرده باشد)${NC}"
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    echo -e "${YELLOW}Branch فعلی: $CURRENT_BRANCH${NC}"
fi

# Push
echo ""
echo -e "${YELLOW}مرحله 7: Push به GitHub${NC}"
echo "در حال push کردن..."

# تلاش برای push به main
git push -u origin main 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Push موفق به branch main${NC}"
else
    # اگر main کار نکرد، branch فعلی را push می‌کنیم
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    echo -e "${YELLOW}⚠ Push به main ناموفق. تلاش برای push به $CURRENT_BRANCH...${NC}"
    git push -u origin $CURRENT_BRANCH
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Push موفق به branch $CURRENT_BRANCH${NC}"
    else
        echo -e "${RED}❌ Push ناموفق!${NC}"
        echo "لطفاً خطای بالا را بررسی کنید."
        exit 1
    fi
fi

# پاک کردن token از git config برای امنیت
echo ""
echo -e "${YELLOW}مرحله 8: پاک کردن Token از Git Config (امنیت)${NC}"
git remote remove origin
git remote add origin "$REPO_URL"
echo -e "${GREEN}✓ Token از git config پاک شد${NC}"

# نتیجه نهایی
echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ موفقیت! پروژه به GitHub push شد${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo "Repository شما:"
echo "  $REPO_URL"
echo ""
echo "برای clone کردن در Windows:"
echo "  git clone $REPO_URL"
echo ""
echo -e "${YELLOW}نکته: Token شما در shell history ذخیره شده.${NC}"
echo -e "${YELLOW}برای پاک کردن history:${NC}"
echo "  history -c"
echo ""
