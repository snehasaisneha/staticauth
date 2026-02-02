# Systemd Service

Run Gatekeeper as a system service that starts on boot.

## Install

```bash
# 1. Edit the service file (change User, WorkingDirectory, ExecStart path)
nano gatekeeper.service

# 2. Copy to systemd
sudo cp gatekeeper.service /etc/systemd/system/

# 3. Reload systemd
sudo systemctl daemon-reload

# 4. Enable and start
sudo systemctl enable gatekeeper
sudo systemctl start gatekeeper
```

## Configuration

Edit these lines in `gatekeeper.service`:

| Line | Description | Example |
|------|-------------|---------|
| `User=` | System user to run as | `www-data`, `gatekeeper` |
| `Group=` | System group | `www-data`, `gatekeeper` |
| `WorkingDirectory=` | Where Gatekeeper is installed | `/opt/gatekeeper` |
| `ExecStart=` | Full path to uv + command | `/usr/local/bin/uv run gatekeeper` |

Find your `uv` path with: `which uv`

## Commands

```bash
# Start
sudo systemctl start gatekeeper

# Stop
sudo systemctl stop gatekeeper

# Restart
sudo systemctl restart gatekeeper

# Check status
sudo systemctl status gatekeeper

# View logs
sudo journalctl -u gatekeeper -f

# View recent logs
sudo journalctl -u gatekeeper --since "1 hour ago"
```

## Troubleshooting

**Service won't start:**
```bash
# Check logs for errors
sudo journalctl -u gatekeeper -n 50

# Test manually
cd /opt/gatekeeper
sudo -u www-data /usr/local/bin/uv run gatekeeper
```

**Permission denied:**
```bash
# Ensure the user owns the directory
sudo chown -R www-data:www-data /opt/gatekeeper
```

**uv not found:**
```bash
# Find uv location
which uv

# Update ExecStart in service file with full path
```
