"""
Vibe Marketing Backend API 使用示例

这个脚本演示如何使用后端API的主要功能：
1. 获取Google OAuth URL
2. 模拟Google登录（使用假ID token）
3. 分析关键词
4. 获取历史记录
5. 获取热门话题
"""

import requests
import json
import time


class VibeMarketingAPI:
    def __init__(self, base_url="http://localhost:8000/api/v1"):
        self.base_url = base_url
        self.token = None
        self.user_info = None

    def get_google_auth_url(self):
        """获取Google OAuth登录URL"""
        print("=" * 50)
        print("1. 获取Google OAuth登录URL")
        print("=" * 50)

        response = requests.get(f"{self.base_url}/auth/google/auth-url")

        if response.status_code == 200:
            data = response.json()
            print(f"✅ 成功获取OAuth URL")
            print(f"📱 登录URL: {data['url'][:80]}...")
            return data['url']
        else:
            print(f"❌ 获取OAuth URL失败: {response.status_code}")
            return None

    def mock_login(self):
        """
        模拟登录（仅用于演示）
        实际使用时需要真实的Google ID token
        """
        print("\n" + "=" * 50)
        print("2. 模拟Google登录（演示用）")
        print("=" * 50)

        # 注意：这是一个演示用的假token
        # 实际使用时需要真实的Google ID token
        fake_token = "fake.google.id.token.for.demo.purposes"

        try:
            response = requests.post(
                f"{self.base_url}/auth/google/login",
                json={"id_token": fake_token}
            )

            if response.status_code == 200:
                data = response.json()
                self.token = data["access_token"]
                self.user_info = data["user"]
                print(f"✅ 登录成功！")
                print(f"👤 用户: {self.user_info['name']} ({self.user_info['email']})")
                print(f"🔐 Token: {self.token[:20]}...")
                return True
            else:
                print(f"❌ 登录失败: {response.status_code}")
                print(f"📄 错误信息: {response.text}")
                return False

        except Exception as e:
            print(f"❌ 登录异常: {e}")
            return False

    def analyze_keyword(self, keyword, analysis_type="both"):
        """分析关键词"""
        print("\n" + "=" * 50)
        print(f"3. 分析关键词: {keyword} ({analysis_type})")
        print("=" * 50)

        headers = {"Authorization": f"Bearer {self.token}"}
        data = {
            "keyword": keyword,
            "analysis_type": analysis_type
        }

        try:
            response = requests.post(
                f"{self.base_url}/x-agent/analyze",
                headers=headers,
                json=data
            )

            if response.status_code == 200:
                result = response.json()
                print(f"✅ 分析成功！")
                print(f"📊 分析ID: {result['id']}")
                print(f"🔄 状态: {result['status']}")

                # 显示分析结果
                if result.get("result_data"):
                    analysis_data = result["result_data"]
                    print(f"\n📈 分析结果:")
                    print(json.dumps(analysis_data, indent=2, ensure_ascii=False))

                return result
            else:
                print(f"❌ 分析失败: {response.status_code}")
                print(f"📄 错误信息: {response.text}")
                return None

        except Exception as e:
            print(f"❌ 分析异常: {e}")
            return None

    def get_analysis_history(self, limit=5):
        """获取分析历史"""
        print("\n" + "=" * 50)
        print(f"4. 获取分析历史 (最近 {limit} 条)")
        print("=" * 50)

        headers = {"Authorization": f"Bearer {self.token}"}
        params = {"limit": limit}

        try:
            response = requests.get(
                f"{self.base_url}/x-agent/history",
                headers=headers,
                params=params
            )

            if response.status_code == 200:
                history = response.json()
                print(f"✅ 获取历史成功！共 {len(history)} 条记录")

                for i, record in enumerate(history, 1):
                    print(f"\n📋 记录 {i}:")
                    print(f"   关键词: {record['keyword']}")
                    print(f"   类型: {record['analysis_type']}")
                    print(f"   状态: {record['status']}")
                    print(f"   时间: {record['created_at']}")

                return history
            else:
                print(f"❌ 获取历史失败: {response.status_code}")
                print(f"📄 错误信息: {response.text}")
                return None

        except Exception as e:
            print(f"❌ 获取历史异常: {e}")
            return None

    def get_trending_topics(self, keyword=None):
        """获取热门话题"""
        print("\n" + "=" * 50)
        print("5. 获取热门话题")
        print("=" * 50)

        headers = {"Authorization": f"Bearer {self.token}"}
        params = {}
        if keyword:
            params["keyword"] = keyword

        try:
            response = requests.get(
                f"{self.base_url}/x-agent/trending",
                headers=headers,
                params=params
            )

            if response.status_code == 200:
                trending = response.json()
                print(f"✅ 获取热门话题成功！")

                if keyword:
                    print(f"🔍 相关关键词: {keyword}")
                print(f"\n📈 热门话题:")
                if trending:
                    for topic in trending:
                        print(f"   • {topic}")
                else:
                    print("   暂无热门话题数据")

                return trending
            else:
                print(f"❌ 获取热门话题失败: {response.status_code}")
                print(f"📄 错误信息: {response.text}")
                return None

        except Exception as e:
            print(f"❌ 获取热门话题异常: {e}")
            return None

    def run_demo(self):
        """运行完整演示"""
        print("🚀 Vibe Marketing Backend API 演示")
        print("=" * 60)

        # 1. 获取OAuth URL
        auth_url = self.get_google_auth_url()

        # 2. 模拟登录
        if not self.mock_login():
            print("\n❌ 无法继续演示，请检查登录配置")
            return

        # 3. 分析关键词
        print("\n" + "-" * 60)
        print("开始演示关键词分析功能...")

        test_keywords = [
            {"keyword": "marketing", "type": "both"},
            {"keyword": "AI tools", "type": "trending"},
            {"keyword": "SEO strategy", "type": "sentiment"}
        ]

        for test in test_keywords:
            self.analyze_keyword(test["keyword"], test["type"])
            time.sleep(1)  # 避免API限制

        # 4. 获取历史记录
        self.get_analysis_history()

        # 5. 获取热门话题
        self.get_trending_topics()
        self.get_trending_topics("digital marketing")

        print("\n" + "=" * 60)
        print("🎉 演示完成！")
        print("=" * 60)


def main():
    # 创建API客户端
    api = VibeMarketingAPI()

    # 运行演示
    api.run_demo()


if __name__ == "__main__":
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到服务器！")
        print("请确保后端服务正在运行:")
        print("   cd backend")
        print("   python run.py")
    except KeyboardInterrupt:
        print("\n\n👋 演示已终止")
    except Exception as e:
        print(f"\n❌ 发生错误: {e}")