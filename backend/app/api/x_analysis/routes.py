from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ...database import get_db
from ...models.x_analysis import XTask, XSearchResult
from ...auth.google_oauth import login_with_google
from ...services.api_layer import task_manager
import asyncio
from datetime import datetime

router = APIRouter()

@router.post("/start")
async def start_analysis(
    keyword: str,
    id_token: str,
    db: Session = Depends(get_db)
):
    """启动 X 平台分析任务"""
    try:
        # 验证用户登录
        auth_result = await login_with_google(id_token, db)
        user_email = auth_result["user"].email

        # 创建分析任务
        task = XTask(
            user_email=user_email,
            keyword=keyword,
            status="pending"
        )
        db.add(task)
        db.commit()
        db.refresh(task)

        # 使用API Layer执行分析任务
        asyncio.create_task(execute_analysis_with_task_manager(task.id, keyword))

        return {
            "task_id": task.id,
            "message": "Analysis task started",
            "status": task.status
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/status/{task_id}")
async def get_task_status(
    task_id: int,
    id_token: str,
    db: Session = Depends(get_db)
):
    """获取任务状态"""
    try:
        # 验证用户登录
        auth_result = await login_with_google(id_token, db)
        user_email = auth_result["user"].email

        # 查询任务
        task = db.query(XTask).filter(XTask.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        # 检查任务权限
        if task.user_email != user_email:
            raise HTTPException(status_code=403, detail="Unauthorized")

        return {
            "task_id": task.id,
            "status": task.status,
            "keyword": task.keyword,
            "created_at": task.created_at,
            "progress": {
                "total_mentions": task.total_mentions,
                "positive_count": task.positive_count,
                "negative_count": task.negative_count,
                "neutral_count": task.neutral_count
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/results/{task_id}")
async def get_analysis_results(
    task_id: int,
    id_token: str,
    db: Session = Depends(get_db)
):
    """获取分析结果"""
    try:
        # 验证用户登录
        auth_result = await login_with_google(id_token, db)
        user_email = auth_result["user"].email

        # 查询任务
        task = db.query(XTask).filter(XTask.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        # 检查任务权限
        if task.user_email != user_email:
            raise HTTPException(status_code=403, detail="Unauthorized")

        # 查询搜索结果
        search_results = db.query(XSearchResult).filter(
            XSearchResult.task_id == task_id
        ).all()

        return {
            "task_id": task.id,
            "keyword": task.keyword,
            "status": task.status,
            "analysis_summary": task.analysis_summary,
            "results": [
                {
                    "tweet_id": result.tweet_id,
                    "text": result.text,
                    "author": result.author,
                    "sentiment": {
                        "score": result.sentiment_score,
                        "label": result.sentiment_label
                    },
                    "created_at": result.created_at,
                    "metadata": result.metadata
                }
                for result in search_results
            ]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/history")
async def get_analysis_history(
    limit: int = 10,
    offset: int = 0,
    id_token: str,
    db: Session = Depends(get_db)
):
    """获取分析历史"""
    try:
        # 验证用户登录
        auth_result = await login_with_google(id_token, db)
        user_email = auth_result["user"].email

        # 查询用户的历史任务
        tasks = db.query(XTask).filter(
            XTask.user_email == user_email
        ).order_by(XTask.created_at.desc()).offset(offset).limit(limit).all()

        return {
            "tasks": [
                {
                    "id": task.id,
                    "keyword": task.keyword,
                    "status": task.status,
                    "created_at": task.created_at,
                    "completed_at": task.completed_at,
                    "progress": {
                        "total_mentions": task.total_mentions,
                        "positive_count": task.positive_count,
                        "negative_count": task.negative_count,
                        "neutral_count": task.neutral_count
                    }
                }
                for task in tasks
            ]
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

async def execute_analysis_with_task_manager(task_id: int, keyword: str):
    """使用Task Manager执行X分析任务"""
    db = next(get_db())  # 获取数据库会话
    try:
        # 执行分析
        analysis_result = await task_manager.execute_x_analysis(
            keyword=keyword,
            user_email="",  # 这个值会在更新任务时从数据库获取
            task_id=str(task_id)
        )

        # 更新任务状态
        task = db.query(XTask).filter(XTask.id == task_id).first()
        if task:
            task.status = analysis_result['status']
            if analysis_result['status'] == 'completed':
                task.total_mentions = analysis_result['total_mentions']
                task.positive_count = analysis_result['positive_count']
                task.negative_count = analysis_result['negative_count']
                task.neutral_count = analysis_result['neutral_count']
                task.completed_at = datetime.utcnow()
                task.analysis_summary = f"分析完成：总计{analysis_result['total_mentions']}条提及，正面{analysis_result['positive_count']}条，负面{analysis_result['negative_count']}条，中性{analysis_result['neutral_count']}条"

            db.commit()

            # 如果是成功，保存详细结果
            if analysis_result['status'] == 'completed' and analysis_result['results']:
                for result in analysis_result['results']:
                    search_result = XSearchResult(
                        task_id=task_id,
                        tweet_id=result['id'],
                        text=result['text'],
                        author=result['author'],
                        sentiment_score=result['sentiment']['score'],
                        sentiment_label=result['sentiment']['label'],
                        created_at=result['created_at'],
                        metadata=result.get('metrics', {})
                    )
                    db.add(search_result)
                db.commit()

    except Exception as e:
        print(f"Analysis execution error: {str(e)}")
        # 更新任务状态为失败
        task = db.query(XTask).filter(XTask.id == task_id).first()
        if task:
            task.status = 'failed'
            task.analysis_summary = f"分析失败：{str(e)}"
            db.commit()
    finally:
        db.close()