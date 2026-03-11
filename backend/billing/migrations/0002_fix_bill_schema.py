from datetime import date

from django.db import migrations, models


def backfill_cycle_month(apps, schema_editor):
    Bill = apps.get_model("billing", "Bill")
    for bill in Bill.objects.filter(cycle_month__isnull=True).only("id", "billing_date"):
        if bill.billing_date:
            bill.cycle_month = bill.billing_date.replace(day=1)
        else:
            bill.cycle_month = date.today().replace(day=1)
        bill.save(update_fields=["cycle_month"])


class Migration(migrations.Migration):
    dependencies = [
        ("billing", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="bill",
            name="cycle_month",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="bill",
            name="member_code_snapshot",
            field=models.CharField(blank=True, default="", max_length=32),
        ),
        migrations.AddField(
            model_name="bill",
            name="member_name_snapshot",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="bill",
            name="paid_amount",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name="bill",
            name="remaining_amount",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name="bill",
            name="is_locked",
            field=models.BooleanField(default=False),
        ),
        migrations.RunPython(backfill_cycle_month, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="bill",
            name="cycle_month",
            field=models.DateField(),
        ),
    ]

