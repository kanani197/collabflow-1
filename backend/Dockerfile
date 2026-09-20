FROM node:20-slim

# Python + pip for the analytics engine (invoked as a child process)
RUN apt-get update && apt-get install -y python3 python3-pip && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --omit=dev

COPY backend ./
COPY analytics /app/analytics
COPY data /app/data
RUN pip3 install --break-system-packages --no-cache-dir -r /app/analytics/requirements.txt
RUN mkdir -p /app/data/uploads

ENV PYTHON_ANALYTICS_PATH=/app/analytics
ENV PYTHON_BIN=python3
ENV UPLOAD_DIRECTORY=/app/data/uploads
ENV DEFAULT_DATASET_PATH=/app/data/default/dissertation_dataset.xlsx

EXPOSE 5000
CMD ["node", "src/server.js"]
