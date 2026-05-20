from sqlalchemy.orm import Session
from database import SessionLocal
import models
from auth import hash_password
from datetime import datetime


def seed_database():
    db = SessionLocal()
    try:
        if db.query(models.User).count() > 0:
            return

        # Seed users
        users_data = [
            {"name": "Admin User", "email": "admin@ekbms.com", "password": "admin123", "role": "admin"},
            {"name": "John Author", "email": "author@ekbms.com", "password": "author123", "role": "author"},
            {"name": "Sara Reviewer", "email": "reviewer@ekbms.com", "password": "reviewer123", "role": "reviewer"},
            {"name": "Mike Employee", "email": "employee@ekbms.com", "password": "employee123", "role": "employee"},
        ]
        users = {}
        for u in users_data:
            user = models.User(
                name=u["name"],
                email=u["email"],
                password_hash=hash_password(u["password"]),
                role=u["role"],
                is_active=True
            )
            db.add(user)
            db.flush()
            users[u["role"]] = user

        # Seed categories
        categories_data = [
            {"name": "HR Policies", "description": "Human Resources policies and procedures"},
            {"name": "IT Support", "description": "IT troubleshooting and support guides"},
            {"name": "Infrastructure", "description": "Network and infrastructure documentation"},
            {"name": "Training Materials", "description": "Employee training resources"},
            {"name": "Finance", "description": "Finance and expense policies"},
            {"name": "Operations", "description": "Operational procedures and SOPs"},
        ]
        categories = {}
        for c in categories_data:
            cat = models.Category(name=c["name"], description=c["description"])
            db.add(cat)
            db.flush()
            categories[c["name"]] = cat

        # Seed tags
        tag_names = ["onboarding", "troubleshooting", "policy", "guide", "FAQ", "SOP", "training", "security", "finance", "general"]
        tags = {}
        for t in tag_names:
            tag = models.Tag(name=t)
            db.add(tag)
            db.flush()
            tags[t] = tag

        # Seed articles
        articles_data = [
            {
                "title": "Employee Onboarding Guide",
                "content": """# Employee Onboarding Guide

Welcome to our organization! This guide will help you get started and navigate your first few weeks.

## Week 1: Getting Started
- Complete HR paperwork and documentation
- Set up your workstation and accounts
- Meet your team and manager
- Review company policies and procedures

## Week 2: Deep Dive
- Begin role-specific training
- Shadow experienced team members
- Attend department meetings
- Review project documentation

## Key Resources
- Employee handbook available on the intranet
- IT support: helpdesk@company.com
- HR contact: hr@company.com

## Important Policies
All new employees must complete:
1. Security awareness training within 5 days
2. Code of conduct acknowledgment
3. Data privacy training
4. Safety briefing

Welcome aboard and we look forward to working with you!""",
                "summary": "Complete guide for new employees covering first week activities, key contacts, and required training.",
                "category": "HR Policies",
                "author_role": "author",
                "status": "approved",
                "tags": ["onboarding", "guide", "training"],
                "view_count": 245
            },
            {
                "title": "IT Password Reset Procedure",
                "content": """# IT Password Reset Procedure

## Overview
This document outlines the standard procedure for resetting user passwords in our organization.

## Self-Service Password Reset
1. Navigate to the company portal at https://portal.company.internal
2. Click "Forgot Password" on the login page
3. Enter your registered email address
4. Check your email for the reset link
5. Follow the link and enter a new password meeting our requirements

## Password Requirements
- Minimum 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- Cannot reuse last 10 passwords

## Contacting IT Support
If self-service reset fails:
1. Call IT Helpdesk: ext. 4357 (HELP)
2. Submit a ticket at helpdesk.company.internal
3. Visit the IT Support desk on Floor 2

## After Reset
- Log in immediately and verify access
- Update saved passwords in your password manager
- Notify your manager if work is impacted""",
                "summary": "Step-by-step guide for resetting passwords using self-service or IT support.",
                "category": "IT Support",
                "author_role": "author",
                "status": "approved",
                "tags": ["troubleshooting", "guide", "security"],
                "view_count": 189
            },
            {
                "title": "Network Infrastructure Overview",
                "content": """# Network Infrastructure Overview

## Network Architecture
Our organization operates a multi-tier network architecture designed for security and reliability.

### Core Network Segments
- **DMZ (192.168.1.0/24)**: Public-facing services
- **Internal LAN (10.0.0.0/8)**: Employee workstations
- **Server VLAN (172.16.0.0/16)**: Internal servers
- **Management VLAN (192.168.100.0/24)**: Network equipment management

## Key Infrastructure Components
### Firewalls
- Primary: Cisco ASA 5525-X (Active/Standby)
- Secondary: Fortinet FortiGate 200E

### Switches
- Core: Cisco Catalyst 9500 Series (redundant)
- Access: Cisco Catalyst 2960 Series

### Wireless
- Controllers: Cisco WLC 3504
- APs: Cisco Aironet 2800 Series

## Internet Connectivity
- Primary: 10Gbps fiber (Provider A)
- Secondary: 1Gbps fiber (Provider B) - failover
- BGP routing between providers

## Security Controls
- IDS/IPS on all network segments
- DLP monitoring on egress traffic
- Network access control (NAC) for all endpoints""",
                "summary": "Technical overview of the company's network infrastructure including architecture, components, and security.",
                "category": "Infrastructure",
                "author_role": "admin",
                "status": "approved",
                "tags": ["guide", "security", "general"],
                "view_count": 134
            },
            {
                "title": "New Employee Training Manual",
                "content": """# New Employee Training Manual

## Introduction
This training manual provides comprehensive information for all new employees joining our organization.

## Module 1: Company Overview
- Company history and mission
- Organizational structure
- Key departments and their functions
- Company values and culture

## Module 2: HR Policies
- Working hours and attendance
- Leave policies (annual, sick, emergency)
- Performance review process
- Code of conduct

## Module 3: IT & Systems
- Available tools and software
- Email and communication platforms
- File storage and sharing (SharePoint)
- Video conferencing (Teams)

## Module 4: Security Awareness
- Data classification
- Handling confidential information
- Phishing awareness
- Physical security

## Module 5: Role-Specific Training
Your manager will schedule specific training for your role.

## Assessment
All modules have online assessments. Minimum score: 80%
Completion deadline: Within 30 days of start date""",
                "summary": "Comprehensive training manual covering company overview, HR policies, IT systems, and security awareness.",
                "category": "Training Materials",
                "author_role": "admin",
                "status": "approved",
                "tags": ["training", "onboarding", "guide"],
                "view_count": 312
            },
            {
                "title": "Finance Expense Policy",
                "content": """# Finance Expense Policy

## Purpose
This policy establishes guidelines for business expense reimbursement.

## Eligible Expenses
- Business travel (flights, hotels, ground transport)
- Client entertainment (with prior approval)
- Training and conferences
- Office supplies (up to $50/month without approval)

## Expense Limits
| Category | Per Day Limit | Approval Required |
|----------|--------------|-------------------|
| Meals | $75 | No |
| Hotels | $200 | No |
| Flights | $800 | Manager |
| Entertainment | $200/person | Director |

## Submission Process
1. Submit within 30 days of expense
2. Attach original receipts
3. Use the expense management system
4. Manager approval required for claims over $500

## Reimbursement Timeline
- Approved expenses reimbursed within 10 business days
- Direct deposit to registered bank account""",
                "summary": "Official expense reimbursement policy including eligible expenses, limits, and submission process.",
                "category": "Finance",
                "author_role": "author",
                "status": "pending",
                "tags": ["policy", "finance"],
                "view_count": 45
            },
            {
                "title": "Operations SOP - Incident Management",
                "content": """# Operations SOP: Incident Management

## Purpose
This Standard Operating Procedure (SOP) defines the process for managing operational incidents.

## Incident Classification
| Priority | Response Time | Examples |
|----------|--------------|---------|
| P1 Critical | 15 minutes | System outage, data breach |
| P2 High | 1 hour | Performance degradation |
| P3 Medium | 4 hours | Non-critical service issues |
| P4 Low | 24 hours | Minor bugs, cosmetic issues |

## Incident Response Process
### 1. Detection & Reporting
- Monitor alerts via PagerDuty
- User reports via helpdesk ticket
- Automated monitoring alerts

### 2. Assessment & Classification
- Assign priority level
- Identify affected systems
- Estimate business impact

### 3. Response & Resolution
- Assemble response team
- Implement workaround if available
- Root cause analysis
- Permanent fix implementation

### 4. Post-Incident Review
- Within 48 hours for P1/P2
- Document lessons learned
- Update runbooks as needed

## Communication Templates
### P1 Incident Communication
Subject: [P1 ACTIVE] {Service} - {Brief Description}
Body: Impact, Current Status, ETA, Actions Being Taken""",
                "summary": "Standard Operating Procedure for incident classification, response, and post-incident review.",
                "category": "Operations",
                "author_role": "admin",
                "status": "approved",
                "tags": ["SOP", "guide", "general"],
                "view_count": 278
            },
            {
                "title": "Security Best Practices",
                "content": """# Security Best Practices

## Overview
This guide outlines security best practices for all employees to protect company assets.

## Password Security
- Use unique passwords for each account
- Enable multi-factor authentication everywhere
- Use an approved password manager
- Never share passwords

## Email Security
- Verify sender before clicking links
- Report phishing to security@company.com
- Never open unexpected attachments
- Check for spoofed domains

## Device Security
- Lock screen when away from desk
- Keep software updated
- Use full-disk encryption
- Don't connect to public WiFi without VPN

## Data Handling
- Classify data before sharing
- Use approved cloud storage only
- Encrypt sensitive files before emailing
- Follow data retention policies

## Incident Reporting
Report security incidents immediately:
- Email: security@company.com
- Phone: ext. 911
- In-person: IT Security desk, Floor 3""",
                "summary": "Essential security best practices for employees covering passwords, email, devices, and data handling.",
                "category": "IT Support",
                "author_role": "author",
                "status": "draft",
                "tags": ["security", "guide", "policy"],
                "view_count": 0
            },
            {
                "title": "FAQ - Common HR Questions",
                "content": """# FAQ: Common HR Questions

## Leave & Time Off

**Q: How do I request annual leave?**
A: Submit leave requests through the HR portal at least 5 business days in advance. Your manager will approve or deny within 2 business days.

**Q: How many sick days do I get?**
A: Full-time employees receive 10 sick days per year. These do not roll over.

**Q: What is the parental leave policy?**
A: Primary caregivers receive 16 weeks paid leave. Secondary caregivers receive 4 weeks paid leave.

## Pay & Benefits

**Q: When is payday?**
A: Salary is paid on the last business day of each month.

**Q: How do I update my bank details?**
A: Log into the HR portal and navigate to Pay > Bank Details.

**Q: What benefits am I eligible for?**
A: Health insurance, dental, vision, 401k with 4% match. See the benefits guide for full details.

## Policies

**Q: What is the dress code?**
A: Business casual Monday-Thursday, casual Friday.

**Q: Can I work from home?**
A: Hybrid policy allows 2 days WFH per week after 3 months tenure. Manager approval required.

**Q: How do I report workplace concerns?**
A: Speak with your manager, HR directly, or use the anonymous ethics hotline at 1-800-XXX-XXXX.""",
                "summary": "Answers to frequently asked HR questions about leave, pay, benefits, and policies.",
                "category": "HR Policies",
                "author_role": "admin",
                "status": "approved",
                "tags": ["FAQ", "policy", "general"],
                "view_count": 421
            },
        ]

        for a_data in articles_data:
            author = users[a_data["author_role"]]
            cat = categories[a_data["category"]]

            article = models.Article(
                title=a_data["title"],
                content=a_data["content"],
                summary=a_data["summary"],
                category_id=cat.id,
                author_id=author.id,
                status=a_data["status"],
                view_count=a_data["view_count"],
            )
            db.add(article)
            db.flush()

            for tag_name in a_data["tags"]:
                if tag_name in tags:
                    article_tag = models.ArticleTag(
                        article_id=article.id,
                        article_tag_id=tags[tag_name].id
                    )
                    db.add(article_tag)

            # Add approval workflow for approved articles
            if a_data["status"] == "approved":
                workflow = models.ApprovalWorkflow(
                    article_id=article.id,
                    reviewer_id=users["reviewer"].id,
                    action="approved",
                    comments="Looks good, approved."
                )
                db.add(workflow)

        db.commit()
        print("Database seeded successfully!")
    except Exception as e:
        db.rollback()
        print(f"Seeding failed: {e}")
        raise
    finally:
        db.close()
