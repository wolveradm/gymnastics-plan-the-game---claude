# Use an official Python runtime as a parent image
FROM python:3.11-slim-bullseye

# Avoid interactive timezone prompt
ENV DEBIAN_FRONTEND=noninteractive

# Set the working directory in the container
WORKDIR /MoneyPrinterTurbo
RUN chmod 777 /MoneyPrinterTurbo

ENV PYTHONPATH="/MoneyPrinterTurbo"

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
        imagemagick \
        ffmpeg \
        curl \
        && rm -rf /var/lib/apt/lists/*

# Fix security policy for ImageMagick
RUN sed -i '/<policy domain="path" rights="none" pattern="@\*"/d' /etc/ImageMagick-6/policy.xml

# Copy only the requirements.txt first to leverage Docker cache
COPY requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir \
    -i https://mirrors.aliyun.com/pypi/simple/ --trusted-host mirrors.aliyun.com \
    --retries 3 --timeout 60 -r requirements.txt || \
    pip install --no-cache-dir \
    -i https://mirrors.tuna.tsinghua.edu.cn/pypi/web/simple/ --trusted-host mirrors.tuna.tsinghua.edu.cn \
    --retries 3 --timeout 60 -r requirements.txt || \
    pip install --no-cache-dir \
    --retries 3 --timeout 60 -r requirements.txt

# Now copy the rest of the codebase into the image
COPY . .

# Expose the port the app runs on
EXPOSE 8501

# Command to run the application
CMD ["streamlit", "run", "./webui/Main.py","--browser.serverAddress=127.0.0.1","--server.enableCORS=True","--browser.gatherUsageStats=False","--server.showEmailPrompt=False"]
