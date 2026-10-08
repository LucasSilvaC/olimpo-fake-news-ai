# Standalone serving context: only model-engine/ is needed at runtime.
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY service.py ./
COPY models ./models
RUN useradd --create-home modelengine
USER modelengine
EXPOSE 8010
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8010/health', timeout=2)"
CMD ["python", "service.py", "--host", "0.0.0.0", "--port", "8010"]
