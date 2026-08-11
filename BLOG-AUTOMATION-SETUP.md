# Blog Automation Setup Guide

## What This Does
- Automatically generates AI blog posts every hour
- Creates full HTML blog posts with AI-generated content
- Generates header images using DALL-E
- Updates your homepage with latest blog
- Commits and pushes to GitHub automatically

## Setup Steps

### 1. Get OpenAI API Key
1. Go to https://platform.openai.com/signup
2. Create account and add payment method
3. Go to API Keys → Create new secret key
4. Copy the key (starts with `sk-...`)

### 2. Set API Key (Choose One)

**Option A: Environment Variable (Recommended)**
1. Press `Win + R` → type `sysdm.cpl` → Enter
2. Go to Advanced → Environment Variables
3. Under User variables, click New
4. Variable name: `OPENAI_API_KEY`
5. Variable value: `sk-your-api-key-here`
6. Click OK

**Option B: Pass directly in script**
Edit `blog-publisher.ps1` line 3:
```powershell
param(
    [string]$ApiKey = "sk-your-api-key-here",
    ...
)
```

### 3. Test the Script
Open PowerShell as Administrator and run:
```powershell
cd D:\xampp\htdocs\portfolio
.\blog-publisher.ps1
```

### 4. Set Up Windows Task Scheduler

**Manual Setup:**
1. Press `Win + R` → type `taskschd.msc` → Enter
2. Click "Create Basic Task"
3. Name: "Blog Auto-Publisher"
4. Trigger: Daily
5. Start time: 12:00 AM
6. Recurrence: Repeat task every 1 hour
7. Action: Start a program
8. Program: `powershell.exe`
9. Arguments: `-ExecutionPolicy Bypass -File "D:\xampp\htdocs\portfolio\blog-publisher.ps1"`
10. Click Finish

**Or run this command in PowerShell (Admin):**
```powershell
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -File `"D:\xampp\htdocs\portfolio\blog-publisher.ps1`""
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 1)
Register-ScheduledTask -TaskName "Blog Auto-Publisher" -Action $action -Trigger $trigger -Description "Auto-generates blog posts every hour"
```

### 5. Monitor Logs
- Check PowerShell window during manual runs
- View blog posts in `D:\xampp\htdocs\portfolio\blog\`
- Check GitHub for auto-commits

## Cost Estimate
- GPT-4o-mini: ~$0.001 per blog (very cheap)
- DALL-E 3: ~$0.04 per image
- Total per hour: ~$0.05
- Total per day: ~$1.20
- Total per month: ~$36

## Troubleshooting
- **"API key not valid"**: Check your OpenAI account has credits
- **"Rate limit"**: Wait 1 minute and try again
- **"No commits"**: Check git is configured properly
- **Script doesn't run**: Run `Set-ExecutionPolicy RemoteSigned` in PowerShell Admin