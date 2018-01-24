from django.db import models
from django.contrib.postgres.fields import JSONField


class Investigation(models.Model):
    name = models.CharField(max_length=200)

    def __str__(self):
        return self.name


class Form(models.Model):
    form_json = JSONField()
    ui_schema_json = JSONField(default={})
    version = models.IntegerField(default=0)
    investigation = models.ForeignKey(Investigation, on_delete=models.CASCADE)


class FormResponse(models.Model):
    json = JSONField()
    form = models.ForeignKey(Form, on_delete=models.CASCADE)