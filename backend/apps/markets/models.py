from django.db import models


class Region(models.Model):
    slug = models.SlugField(unique=True)
    name_uz = models.CharField(max_length=128)
    name_ru = models.CharField(max_length=128, blank=True)

    def __str__(self):
        return self.name_uz


class District(models.Model):
    region = models.ForeignKey(Region, on_delete=models.CASCADE, related_name="districts")
    slug = models.SlugField(unique=True)
    name_uz = models.CharField(max_length=128)
    name_ru = models.CharField(max_length=128, blank=True)
    is_city = models.BooleanField(default=False)

    class Meta:
        ordering = ["name_uz"]

    def __str__(self):
        return self.name_uz


class Market(models.Model):
    class Type(models.TextChoices):
        DEHQON = "dehqon", "Dehqon bozori"
        WHOLESALE = "ulgurji", "Ulgurji"
        SUPERMARKET = "supermarket", "Supermarket"
        ONLINE = "onlayn", "Onlayn"

    district = models.ForeignKey(District, on_delete=models.CASCADE, related_name="markets")
    slug = models.SlugField(unique=True)
    name_uz = models.CharField(max_length=160)
    name_ru = models.CharField(max_length=160, blank=True)
    lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    type = models.CharField(max_length=24, choices=Type.choices, default=Type.DEHQON)
    aliases = models.JSONField(default=list, blank=True)

    def __str__(self):
        return self.name_uz
