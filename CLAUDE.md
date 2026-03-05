# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The Vibe Marketing project is a multi-agent marketing analysis and content generation system that consists of six specialized agents designed to work together:

1. **ceo-manager** - Chief executive officer agent that coordinates and manages the entire marketing system, makes strategic decisions, and resolves conflicts between other agents
2. **seo-analyzer** - Handles SEO performance analysis, keyword research, and competitor strategies
3. **reddit-monitor** - Monitors Reddit for trending topics, community discussions, and sentiment analysis
4. **x-social-monitor** - Tracks X (Twitter) platform for brand mentions, sentiment trends, and crisis alerts
5. **marketing-content-generator** - Creates marketing content, copy, and social media posts based on data analysis
6. **marketing-report-synthesizer** - Consolidates analysis from multiple sub-agents into comprehensive marketing reports

## Directory Structure

```
Vibe Marketing/
├── .claude/
│   ├── agents/                 # Agent definition files (.md files)
│   └── agent-memory/           # Persistent memory for each agent
├── agents/                    # Agent code implementations
│   ├── seo_analyzer/
│   ├── reddit_miner/
│   ├── x_monitor/
│   ├── content_generator/
│   └── data_summarizer/
├── configs/
│   ├── agent_configs/         # Individual agent configurations
│   └── api_keys.json          # API key storage
├── data/
│   ├── raw_data/              # Raw collected data
│   ├── processed_data/        # Processed/analyzed data
│   └── reports/               # Generated reports
├── tools/                     # Utility scripts
├── logs/                      # Log files
└── templates/                 # Report and content templates
```

## Agent Definitions

Each agent is defined in `.claude/agents/` with a corresponding `.md` file that contains:

- YAML frontmatter with name, description, model, color, and memory settings
- Detailed system prompt specifying the agent's role, responsibilities, and methodology
- Memory management guidelines and persistent memory directory information

## Key Features

- **Specialized Agents**: Each agent focuses on a specific marketing function
- **Persistent Memory**: Each agent maintains memory across conversations in dedicated directories
- **Data Integration**: Agents can share and synthesize data for comprehensive analysis
- **MCP Integration**: Connected to Linkup MCP server for enhanced functionality

## Common Commands

- `/agents` - Initialize the six marketing agents (ceo-manager, seo-analyzer, reddit-monitor, x-social-monitor, marketing-content-generator, marketing-report-synthesizer)
- `claude mcp list` - View configured MCP servers
- Standard file operations to manage agent configurations and data

## Development Workflow

1. Use specialized agents for their designated tasks:
   - Use `ceo-manager` as the executive coordinator for strategic decisions and cross-agent management
   - Use `seo-analyzer` for SEO analysis and keyword research
   - Use `reddit-monitor` for Reddit trend monitoring and sentiment analysis
   - Use `x-social-monitor` for X/Twitter brand mention monitoring
   - Use `marketing-content-generator` for creating marketing content from data
   - Use `marketing-report-synthesizer` for consolidating multiple analysis results

2. Store raw data in `data/raw_data/`, processed data in `data/processed_data/`, and reports in `data/reports/`

3. Leverage the persistent memory feature of each agent to build institutional knowledge over time

## MCP Server Integration

The project includes MCP server integrations for extended functionality:

```
Name: linkup
Transport: SSE
URL: https://linkup-mcp-server--linkupplatform.run.tools

Name: exa
Transport: SSE
URL: https://exa.run.tools
```

## Best Practices

- Always use the appropriate specialized agent for specific marketing tasks
- Ensure data flows properly between agents, especially when synthesizing reports
- Maintain consistent terminology and metrics across agent communications
- Utilize the persistent memory to build upon previous insights and learning
- Regularly review and update agent definitions as marketing requirements evolve