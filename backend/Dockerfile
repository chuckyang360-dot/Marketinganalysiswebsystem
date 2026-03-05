FROM python:3.11-slim

WORKDIR /app

# 复制 requirements 文件
COPY requirements.txt .

# 安装依赖 - 使用 --no-cache-dir 减少镜像大小
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 创建必要的目录
RUN mkdir -p logs

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]