# Generated by Django 2.0.1 on 2018-04-24 12:09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('forms', '0006_investigation_data_privacy_url'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='email',
            field=models.EmailField(max_length=254, unique=True, verbose_name='E-Mail-Adresse'),
        ),
    ]