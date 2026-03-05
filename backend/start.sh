#!/bin/sh
# Railway 启动脚本

# 设置环境变量
export PYTHONUNBUFFERED=1
export DEBUG=false

# 启动应用
uvicorn app.main:app --host 0.0.0.0 --port 8000
