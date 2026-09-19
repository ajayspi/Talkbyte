import subprocess
import glob
files = glob.glob('backend/app/**/*.py', recursive=True)
for f in files:
    subprocess.run(['python3', '-m', 'autopep8', '--in-place', '--aggressive', '--aggressive', f])
