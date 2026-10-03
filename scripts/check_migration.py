import paramiko

SERVER_IP = "10.1.0.11"
USERNAME = "ubuntu-server"
PASSWORD = "pTT!CT01"

def run_cmd(ssh, cmd, title):
    print(f"\n{'='*50}\n>>> {title}\n{cmd}\n{'='*50}")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=30)
    for line in stdout:
        print(line, end="")
    err = stderr.read().decode()
    if err:
        print(f"STDERR: {err}")

def main():
    print(f"Connecting to {SERVER_IP} to check database migration...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=10)
        print("Connected successfully!")
        
        # Check current Alembic revision in the API container
        run_cmd(ssh, "docker exec daily_discovery_api alembic current", "Current Database Migration Status")
        
        # Alternatively, check logs for recent migration messages
        run_cmd(ssh, "docker logs daily_discovery_api --tail 50 | grep -i 'alembic'", "Recent API Logs containing 'alembic'")
        
        ssh.close()
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    main()
