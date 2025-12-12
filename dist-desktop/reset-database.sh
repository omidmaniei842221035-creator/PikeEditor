#!/bin/bash
echo "========================================"
echo "  بازنشانی دیتابیس - Reset Database"
echo "========================================"
echo ""
echo "⚠️  این عملیات تمام داده‌های موجود را حذف می‌کند!"
echo "⚠️  This will DELETE all existing data!"
echo ""
read -p "آیا مطمئن هستید؟ (y/n) Are you sure? " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "عملیات لغو شد / Operation cancelled"
    exit 0
fi

echo ""
echo "🗑️  Deleting old database..."

if [ -f "pos-system.db" ]; then
    rm -f pos-system.db
    echo "✅ Database deleted"
else
    echo "ℹ️  No database found"
fi

echo ""
echo "✅ Reset complete!"
echo ""
echo "📝 Now run the application and re-import your data"
echo ""
