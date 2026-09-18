from django.contrib import admin
from .models import LLMCallLog, KnowledgeChunk

admin.site.register(LLMCallLog)
admin.site.register(KnowledgeChunk)
