# Generated by Django 2.0.1 on 2018-07-24 11:10

import django.contrib.postgres.fields.jsonb
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('forms', '0022_investigation_color'),
    ]

    operations = [
        migrations.CreateModel(
            name='FormInstanceTemplate',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('description', models.TextField()),
                ('form_json', django.contrib.postgres.fields.jsonb.JSONField()),
                ('ui_schema_json', django.contrib.postgres.fields.jsonb.JSONField(default={})),
                ('priority_fields', django.contrib.postgres.fields.jsonb.JSONField(default=[])),
                ('email_template', models.TextField(default='Thank you for participating in a crowdnewsroom investigation!')),
                ('email_template_html', models.TextField(default='Thank you for participating in a crowdnewsroom investigation!')),
                ('redirect_url_template', models.TextField(default='https://forms.crowdnewsroom.org')),
            ],
        ),
    ]