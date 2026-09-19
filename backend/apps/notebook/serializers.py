from rest_framework import serializers

from .models import NotebookEntry


class NotebookEntrySerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="title")

    class Meta:
        model = NotebookEntry
        fields = ("id", "type", "name", "amount", "date", "category", "created_at")
        read_only_fields = ("id", "created_at")

    def validate_amount(self, value):
        if value is None or value <= 0:
            raise serializers.ValidationError("Summa noldan katta bo'lishi kerak")
        return value

    def validate_type(self, value):
        if value not in (NotebookEntry.Type.IN, NotebookEntry.Type.OUT):
            raise serializers.ValidationError("type: in yoki out")
        return value
