# Generated by Django 2.0.1 on 2018-06-07 15:53

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('forms', '0012_merge_20180607_1437'),
    ]

    operations = [
        migrations.AddField(
            model_name='formresponse',
            name='last_status_changed_date',
            field=models.DateTimeField(blank=True, default=None, null=True),
        ),
    ]
