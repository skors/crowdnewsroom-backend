# Generated by Django 2.0.1 on 2018-10-18 13:56

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('forms', '0025_auto_20181010_0822'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='investigation',
            options={'permissions': (('view_investigation', 'View investigation'), ('manage_investigation', 'Manage investigation'), ('admin_investigation', 'Admin investigation'), ('master_investigation', 'Delete investigation and manage owners'))},
        ),
    ]
