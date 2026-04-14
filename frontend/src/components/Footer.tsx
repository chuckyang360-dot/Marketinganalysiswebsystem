import { Link } from 'react-router-dom';
import { BarChart3, FileText, LayoutDashboard, Lightbulb, Globe, Book, HelpCircle, Mail, MapPin, Tag, Twitter, Linkedin, Github, Youtube } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-[#EAEAEA] bg-[#F7F8FA]">
      <div className="mx-auto max-w-[1280px] px-6 py-14 lg:px-10">
        <div className="mb-12 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-[1.8fr_1fr_1fr_1fr]">
          <div className="lg:pr-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-blue-500 text-white">
                GP
              </div>
              <span className="text-[17px] font-bold tracking-tight text-[#111111]">GlobalPulse AI</span>
            </div>
            <p className="mb-5 max-w-[260px] text-[13px] leading-relaxed text-[#888888]">
              面向出海团队的 AI 营销与商品增长工作台。把市场信号转化为可扩展的增长动作。
            </p>
            <div className="flex items-center gap-2.5">
              {[Twitter, Linkedin, Github, Youtube].map((Icon, idx) => (
                <a
                  key={idx}
                  href="#"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#EAEAEA] bg-white text-[#888888] transition-all duration-200 hover:border-violet-200 hover:text-violet-600"
                >
                  <Icon className="h-[13px] w-[13px]" />
                </a>
              ))}
            </div>

            <div className="mt-6">
              <h3 className="mb-4 text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#888888]">联系方式</h3>
              <ul className="space-y-3.5">
                <li className="flex items-center gap-2.5 text-[13px] text-[#888888]">
                  <Mail className="h-4 w-4" />
                  <span>联系人：杨克</span>
                </li>
                <li className="flex items-center gap-2.5 text-[13px] text-[#888888]">
                  <Mail className="h-4 w-4" />
                  <span>邮箱：chuckyang360@gmail.com</span>
                </li>
                <li className="flex items-center gap-2.5 text-[13px] text-[#888888]">
                  <MapPin className="h-4 w-4" />
                  <span>公司：杭州越响信息科技有限公司</span>
                </li>
              </ul>
            </div>
          </div>
          <FooterColumn
            title="产品"
            links={[
              { label: '市场分析', icon: <BarChart3 className="h-4 w-4" />, href: '/product' },
              { label: t('nav.pricing'), icon: <Tag className="h-4 w-4" />, href: '/pricing' },
              { label: '内容机会', icon: <Lightbulb className="h-4 w-4" />, href: '#' },
              { label: '内容创意', icon: <FileText className="h-4 w-4" />, href: '#' },
              { label: '工作台', icon: <LayoutDashboard className="h-4 w-4" />, href: '/workspace' },
            ]}
          />
          <FooterColumn
            title="资源"
            links={[
              { label: '案例展示', icon: <FileText className="h-4 w-4" />, href: '/cases' },
              { label: '支持中心', icon: <HelpCircle className="h-4 w-4" />, href: '#' },
              { label: '使用指南', icon: <Book className="h-4 w-4" />, href: '#' },
              { label: '常见问题', icon: <HelpCircle className="h-4 w-4" />, href: '#' },
            ]}
          />
          <FooterColumn
            title="公司"
            links={[
              { label: '关于我们', icon: <Lightbulb className="h-4 w-4" />, href: '/about' },
              { label: '公司介绍', icon: <Globe className="h-4 w-4" />, href: '#' },
              { label: '联系合作', icon: <Mail className="h-4 w-4" />, href: '#' },
              { label: '隐私政策', icon: <Globe className="h-4 w-4" />, href: '#' },
            ]}
          />
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-[#EAEAEA] pt-7 sm:flex-row">
          <p className="text-[12px] text-[#AAAAAA]">© 2026 GlobalPulse AI. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/" className="text-[12px] font-medium text-[#AAAAAA] transition-colors hover:text-[#444444]">首页</Link>
            <Link to="/about" className="text-[12px] font-medium text-[#AAAAAA] transition-colors hover:text-[#444444]">服务</Link>
            <Link to="#" className="text-[12px] font-medium text-[#AAAAAA] transition-colors hover:text-[#444444]">信息</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

interface FooterColumnProps {
  title: string;
  links: { label: string; icon: React.ReactNode; href: string }[];
}

function FooterColumn({ title, links }: FooterColumnProps) {
  return (
    <div className="min-w-0">
      <h3 className="mb-5 text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#888888]">
        {title}
      </h3>
      <ul className="space-y-3.5">
        {links.map((link, idx) => (
          <li key={idx}>
            <Link
              to={link.href}
              className="flex items-center gap-2.5 text-[13px] text-[#888888] transition-colors hover:text-[#111111]"
            >
              {link.icon}
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
