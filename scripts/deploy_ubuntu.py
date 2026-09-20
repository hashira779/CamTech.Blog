import paramiko
import time
import sys

SERVER_IP = "10.1.0.11"
USERNAME = "ubuntu-server"
PASSWORD = "pTT!CT01"
REMOTE_REPO_DIR = "/home/ubuntu-server/CamTech.Blog"
GIT_REPO_URL = "https://github.com/hashira779/CamTech.Blog.git"

def execute_remote_cmd(ssh, cmd, title="", timeout=300):
    if title:
        print(f"\n>>> [{title}] {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd, get_pty=True, timeout=timeout)
    
    # Stream output
    output_lines = []
    for line in iter(stdout.readline, ""):
        print(line, end="")
        output_lines.append(line)
        
    exit_status = stdout.channel.recv_exit_status()
    if exit_status != 0:
        print(f"FAILED (Exit status: {exit_status})")
    else:
        print(f"✓ Success: {title or cmd}")
    return exit_status, "".join(output_lines)

def deploy():
    print("==================================================================")
    print(f"🚀 Deploying Daily Discovery Platform to Ubuntu Server ({SERVER_IP})")
    print("==================================================================")
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print(f"Connecting via SSH to {SERVER_IP} as {USERNAME}...")
        ssh.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=15)
        print("✓ Connected successfully!")
        
        # 1. Clone or Pull repository
        check_dir_cmd = f"test -d {REMOTE_REPO_DIR} && echo 'EXISTS' || echo 'NOT_FOUND'"
        _, out = execute_remote_cmd(ssh, check_dir_cmd, "Checking Repository Directory")
        
        if "EXISTS" in out:
            pull_cmd = f"cd {REMOTE_REPO_DIR} && git reset --hard HEAD && git checkout main && git pull origin main"
            execute_remote_cmd(ssh, pull_cmd, "Pulling Latest Code from GitHub")
        else:
            clone_cmd = f"git clone {GIT_REPO_URL} {REMOTE_REPO_DIR}"
            execute_remote_cmd(ssh, clone_cmd, "Cloning Repository from GitHub")
            
        # 2. Build and run Docker containers
        up_cmd = f"cd {REMOTE_REPO_DIR} && docker compose down --remove-orphans && docker compose up --build -d"
        status, _ = execute_remote_cmd(ssh, up_cmd, "Building and Launching Containers via Docker Compose", timeout=900)
        if status != 0:
            print("Docker compose build failed. Inspecting logs...")
            execute_remote_cmd(ssh, f"cd {REMOTE_REPO_DIR} && docker compose logs --tail=50", "Docker Logs")
            sys.exit(1)
            
        # 3. Wait for PostgreSQL and API health
        print("\nWaiting for API and Database containers to achieve healthy state (15s)...")
        time.sleep(15)
        
        # 4. Check container statuses
        execute_remote_cmd(ssh, f"cd {REMOTE_REPO_DIR} && docker compose ps", "Container Status Triad")
        
        # 5. Seed initial data in PostgreSQL
        seed_cmd = f"cd {REMOTE_REPO_DIR} && docker compose exec -T api python seed_data.py"
        execute_remote_cmd(ssh, seed_cmd, "Seeding Production PostgreSQL Database with Verified Content")
        
        # 6. Verify Health and Endpoints
        verify_cmd = """
        curl -s http://localhost:8000/health && echo ""
        curl -s http://localhost:8000/api/v1/articles | head -c 200 && echo ""
        curl -s -I http://localhost:3000/ | head -n 3
        """
        execute_remote_cmd(ssh, verify_cmd, "Validating Production Endpoints on Remote Host")
        
        print("\n==================================================================")
        print("🎉 DEPLOYMENT COMPLETE ON UBUNTU SERVER (10.1.0.11)")
        print("Frontend Web:  http://10.1.0.11:3000")
        print("Backend API:   http://10.1.0.11:8000")
        print("API Docs:      http://10.1.0.11:8000/docs")
        print("MinIO Storage: http://10.1.0.11:9001")
        print("==================================================================")
        
    except Exception as e:
        print(f"\n❌ Deployment error: {e}")
        sys.exit(1)
    finally:
        ssh.close()

if __name__ == "__main__":
    deploy()
