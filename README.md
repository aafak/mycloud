# mycloud
This is my test repository

Create new repositiry on github
https://help.github.com/articles/create-a-repo/

Open Terminal (for Mac and Linux users) or the command prompt (for Windows users).

Type git clone, and then paste the https cloneURL( https://github.com/aafak/mycloud.git) It will look like this, with your GitHub username instead of YOUR-USERNAME:

root@aafak-HP-ProBook-4530s:~/aafak/git-demo# git clone https://github.com/aafak/mycloud.git
root@aafak-HP-ProBook-4530s:~/aafak/git-demo/mycloud# git status
# On branch master
nothing to commit (working directory clean)
root@aafak-HP-ProBook-4530s:~/aafak/git-demo/mycloud# 
root@aafak-HP-ProBook-4530s:~/aafak/git-demo/mycloud# gedit test.c
root@aafak-HP-ProBook-4530s:~/aafak/git-demo/mycloud# git status
# On branch master
# Untracked files:
#   (use "git add <file>..." to include in what will be committed)
#
#	test.c
nothing added to commit but untracked files present (use "git add" to track)
root@aafak-HP-ProBook-4530s:~/aafak/git-demo/mycloud# 
root@aafak-HP-ProBook-4530s:~/aafak/git-demo/mycloud# git add test.c 
root@aafak-HP-ProBook-4530s:~/aafak/git-demo/mycloud# git status
# On branch master
# Changes to be committed:
#   (use "git reset HEAD <file>..." to unstage)
#
#	new file:   test.c
#
root@aafak-HP-ProBook-4530s:~/aafak/git-demo/mycloud# git commit -m "my first file" test.c
[master 2baa555] my first file
 1 file changed, 1 insertion(+)
 create mode 100644 test.c
root@aafak-HP-ProBook-4530s:~/aafak/git-demo/mycloud# 

