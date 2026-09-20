import paramiko
import sys
import time

SERVER_IP = "10.1.0.11"
USERNAME = "ubuntu-server"
PASSWORD = "pTT!CT01"

def run_sudo_cmd(ssh, cmd, title=""):
    if title:
        print(f"\n=======================================================")
        print(f">>> {title}")
        print(f"Command: {cmd}")
        print(f"=======================================================")
    
    wrapped_cmd = f"echo '{PASSWORD}' | sudo -S bash -c \"{cmd}\""
    stdin, stdout, stderr = ssh.exec_command(wrapped_cmd, get_pty=True, timeout=180)
    
    output_lines = []
    for line in iter(stdout.readline, ""):
        print(line, end="")
        output_lines.append(line)
        
    exit_status = stdout.channel.recv_exit_status()
    if exit_status != 0:
        print(f"\n❌ FAILED with status code: {exit_status}")
    else:
        print(f"\n✓ Completed: {title or cmd}")
    return exit_status, "".join(output_lines)

def main():
    print(f"Connecting via SSH to {SERVER_IP}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=15)
    print("✓ SSH connected successfully.")
    
    # 1. Add keyring directory and GPG key
    run_sudo_cmd(ssh, "mkdir -p --mode=0755 /usr/share/keyrings", "Step 1: Ensure keyring directory")
    run_sudo_cmd(ssh, "curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg -o /usr/share/keyrings/cloudflare-main.gpg", "Step 2: Download Cloudflare GPG Key")
    
    # 2. Add apt repository
    run_sudo_cmd(ssh, "echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main' > /etc/apt/sources.list.d/cloudflared.list", "Step 3: Add Cloudflare Apt Repository")
    
    # 3. Update apt and install cloudflared
    run_sudo_cmd(ssh, "apt-get update && apt-get install -y cloudflared", "Step 4: Update Apt and Install cloudflared")
    
    # 4. Install cloudflared service with token
    token = "eyJhIjoiYTZkNTM1YTYzOWY3ZTk5ZjJlNDkzNGNmZjQ3ZGUyODgiLCJ0IjoiNTEyZWQ2MjAtN2UxNC00YmY1LThlMTktODJjZDVmNDUxNzJkIiwicyI6Ik16ZG1NR05rWldFdE5USXpaaTAwWkdFeUxXSXlOV1V0TWpRMlpqWmhZMlk1TURRNSJ9"
    run_sudo_cmd(ssh, f"cloudflared service install {token}", "Step 5: Install and Enable cloudflared Service")
    
    # 5. Check service status
    time.sleep(3)
    run_sudo_cmd(ssh, "systemctl status cloudflared --no-pager", "Step 6: Check cloudflared Service Status")
    
    ssh.close()
    print("\n🎉 Cloudflared tunnel setup finished!")

if __name__ == "__main__":
    main()
