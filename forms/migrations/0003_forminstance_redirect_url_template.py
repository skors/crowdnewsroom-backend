# Generated by Django 2.0.1 on 2018-03-28 16:12

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('forms', '0002_forminstance_email_template'),
    ]

    operations = [
        migrations.AddField(
            model_name='forminstance',
            name='redirect_url_template',
            field=models.TextField(default='https://forms.crowdnewsroom.org'),
        ),
    ]
