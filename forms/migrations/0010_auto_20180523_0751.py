# Generated by Django 2.0.1 on 2018-05-23 07:51

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('forms', '0009_auto_20180516_0726'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='formresponse',
            name='email',
        ),
        migrations.RemoveField(
            model_name='formresponse',
            name='token',
        ),
    ]