---
layout: post
title: 在Linux中搭建可自动部署的Git服务器
date: 2018-08-04
categories: blog
tags: [Linux,Ubuntu,版本控制,Git]
description: 文章金句。
---
# 背景与介绍
>最近在维护博客的时候一直被Github蛋疼的提交与部署速度(符合国情)困扰。索性在本地搭建一个版本,这样就能在不妨碍网站正常运作的情况下肆意调戏了,可随后发现博客的框架在Windows上不！支！持！虽然一些Windows用户发掘了一些运行方案，但第一时间想到的还是我的Ubuntu啊~ 

#### 博客生产流程
![图片好像...不见了!](http://wx2.sinaimg.cn/mw690/006WKNnMgy1ftxzk6rq10j30j304zwei.jpg)
##### 而负责管理各个版本的角色，就是今天我们要讲的Git啦。

>Git是一个开源的分布式版本控制系统，用于敏捷高效地处理任何或小或大的项目。<br><br>
Git 是 Linus Torvalds 为了帮助管理 Linux 内核开发而开发的一个开放源码的版本控制软件。<br><br>
Git 与常用的版本控制工具 CVS, Subversion 等不同，它采用了分布式版本库的方式，不必服务器端软件支持。

实践出真知，下面开始动手。


# 准备工作

操作系统：```Ubuntu 18.04 LTS ```  
安装：```$ sudo apt-get install git```  
操作步骤:
>1.在服务器上创建专门用于git操作的用户  
2.本地创建新的ssh秘钥，并将公钥上传至服务器 中，用于远程连接步骤1中的git用户  
3.在服务器上创建git项目文件夹  
4.将本地项目文件推送至服务器  

# 流程
步骤明确了，那么我们就开始操作。

### <u>1. 在服务器上创建专门用于git操作的用户</u>

*如果只是自己在使用Git服务器,那么这一步不是必须的,但为了更好地管理版本资源,还是建议专门建立一个git操作员。*

在服务器中输入以下命令，建立名为git的用户：
~~~
$ sudo su                  
$ adduser git                  
Adding user 'git' ...                  
Adding new group 'git' (1001) ...                  
Adding new user 'git' (1001) with group 'git' ...                  
Creating home directory '/home/git' ...                  
Copying files from '/etc/skel' ...                  
Enter new UNIX password:
~~~

这里额外要说一下坑过我的一个小细节 T_T~
>Linux下创建用户时会用到useradd和adduser这两个命令，他们的区别如下：  
1.使用useradd时，如果后面不添加任何参数选项，例如：#sudo useradd   test创建出来的用户将是默认“三无”用户：一无Home Directory，二无密码，三无系统Shell。   
2.使用adduser时，创建用户的过程更像是一种人机对话，系统会提示你输入各种信息，然后会根据这些信息帮你创建新用户。  

使用useradd**默认是不会创建Home文件夹**的。博主年少无知,第一次创建用户却发现自己啥都没有,是个"黑户",所以在不了解参数的情况下还是使用adduser吧~

### <u>2. git的权限管理</u>
由于版本控制系统直接接触了项目代码，权限问题显得尤其重要。在大型开发团队中会使用```gitolite```或```gitosis```来管理。一般小团队的话，可以直接通过ssh公钥进行管理即可。这里我们介绍SSH方式。

#### 2.1 配置服务端的SSH访问
Linux终端:
~~~
# 1.切换到git账号
$ su git
# 2.进入 git账户的主目录
$ cd /home/git

# 3.创建.ssh的配置，如果此文件夹已经存在请忽略此步。
$ mkdir .ssh

# 4. 进入刚创建的.ssh目录并创建authorized_keys文件,此文件存放客户端远程访问的 ssh的公钥。
$ cd /home/git/.ssh
$ touch authorized_keys

# 5. 设置权限，此步骤不能省略，而且权限值也不要改，不然会报错。
$ chmod 700 /home/git/.ssh/
$ chmod 600 /home/git/.ssh/authorized_keys
~~~

#### 2.2 配置客户端的SSH访问
**第一步：先检查客户端是否已经拥有ssh公钥和私钥：进入用户的主目录。**  
Windows系统：```C:\Users\用户名```  
Linux系统：```/home/用户名```  
Mac系统：```/Users/用户名```  

然后查看是否有```.ssh```文件夹，此文件夹下是否有如下几个文件。
~~~
# 用户主目录的.ssh文件夹下
.ssh
├── id_rsa      
└── id_rsa.pub  # 我们要用的公钥
~~~

如果没有，那么用ssh-keygen创建ssh的公钥。  
客户端终端：
~~~
$ ssh-keygen -t rsa

# 接下来，三个回车默认即可。
~~~
创建私钥成功后，在查看用户目录是否有意加有了公钥文件id_rsa.pub

**第二步： 拷贝公钥到服务器**

至于如何把客户端的文件拷贝到服务器端，可使用```scp```命令，如果使用的VMware作虚拟机，还可以直接复制粘贴，大家自行研究，这里就不赘述了。

拷贝目的地：/home/git/.ssh/

#### 2.3 服务器端添加客户端的SSH公钥

切换到服务器端，把刚才上传的id_rsa.pub文件的内容添加到authorized_keys中，就可以允许客户端ssh访问了。
~~~
# 切换到git账户
$ su git
$ cd /home/git/.ssh

$ ls -la
# 查看一下.ssh目录是否有authorized_keys和id_rsa.pub文件
# .
# |-- authorized_keys
# |-- id_rsa.pub

# 如果有，那么进行下面的把id_rsa.pub文件中的内容添加到authorized_keys中.
$ cat laoma.pub >> authorized_keys

# >> 是在文件后面追加的意思。
# 如果用其他编辑器，每个ssh的pub要单独一行。
# 建议用cat命令方便简单。
~~~
到此为止，您配置的客户端应该可以ssh的方式直接用git账号登录服务器。
~~~
# 在客户端用ssh测试连接远程服务器
$ ssh git@服务端IP   

# 第一次连接有警告，输入yes继续即可。如果可以连接上，那么恭喜你的ssh配置已经可以了。
~~~

### <u>3. 构建仓库</u> 
使用git构建仓库，实际上就是在指定代码提交与拉取等操作的目的地。 

#### 3.1 远程仓库
远程仓库就像上司，我们所做的所有工作最终都要提交给他，他代表了项目的真实样貌。 

这里的远程仓库就是指Linux服务端的仓库了，下面看看如何构造。

Linux终端:

~~~
# 切换到git账号
$ su git
# 进入git账号的用户主目录。

$ cd /home/git
# 在用户主目录下创建 test.git仓库的文件夹

$ mkdir test.git  && cd test.git
# 在test.git目录下初始化git仓库

$ git init --bare
# 输出如下内容，表示成功
Initialized empty Git repository in /home/git/test.git/
~~~

>```git init --bare``` 是在当前目录创建一个裸仓库，也就是说没有工作区的文件，直接把git仓库隐藏的文件放在当前目录下，此目录仅用于存储仓库的历史版本等数据。不能储存项目代码。  
  如果使用了```git init```初始化，则远程仓库的目录下，也包含work tree，当本地仓库向远程仓库push时，如果远程仓库正在push的分支上（如果当时不在push的分支，就没有问题）, 那么push后的结果不会反应在work tree上,  
    也即在远程仓库的目录下对应的文件还是之前的内容，必须得使用```git reset --hard```才能看到push后的内容。  
    
针对我的需求，在服务器上只有一个master分支，为了防止提交后远程仓库代码不更新，所以最好是创建仓库是带上```--bare```参数。

#### 3.2 本地仓库
本地仓库就是员工，员工可以向上司索要现有的项目版本，也可以将自己写好的项目版本上交给他。

客户端终端：
~~~
$ mkdir demos  #创建一个空的仓库文件夹
$ cd demos     
$ git init    #初始化仓库
# 本地仓库用作项目存放处,所以创建普通仓库,不用带--bare参数
$ touch a.txt #创建一个空文本#
$ echo 'hello sweety~' >> a.txt #写点什么~

$ git add .#将当前文件夹所有文件添加到git的缓存区中
$ git commit -m 'the first commit'
# 将缓存区文件提交到本地仓库中,并携带提交备注

# 把当前仓库跟远程仓库添映射
$ git remote add origin git@服务端IP:test.git

# 把当前仓库push到远程仓库。
$ git push -u origin master
~~~

>Git中的术语：   
Branch：分支，仓库中可以有不同的项目版本，默认版本称作master。  
Checkout：选择一个分支
Merge：合并，将不同的开发线合并。   
Pull：拉取，将远程仓库的指定分支拉取到本地仓库。  
Push：推送，将本地仓库的更改推送至远程仓库。  
Working tree：工作树/区，项目文件。  
Staging area：暂存区，未提交的更改所存放的位置。  
Commit：提交，将更改提交到本地仓库。

**关于更多Git的命令可查看:[Git 基本操作](http://www.runoob.com/git/git-basic-operations.html)**  

至此,一个简单的Git系统我们已经做好了,剩下的就是通过本地仓库将相关项目文件推送至远程仓库,相关操作也可以在上述链接中找到。

#### 3.3 钩子

蛤？还没结束？没错，将代码推送到远程仓库后，**因为我们使用了```bare repo```裸仓库，我们并不能看到项目代码，更不能部署服务器**！所以我们需要新建一个Web站点文件夹，并在远程仓库使用```hooks```钩子在每次提交后将代码更新至站点！

hooks类似于Web中的事件监听，在git中内置了多种动作的钩子，以下是我们需要知道的原理和流程。

1. git用户执行git push操作  
2. 远程仓库发现有用户执行了push操作，就会执行一个脚本post-receive（钩子）  
3. 在post-receive脚本中，将git仓库的代码拷贝到web站点目录下

**位置：**  

>git普通仓库钩子在.git/hooks/中  
git裸仓库钩子在hooks/中


**实现：**

第一种方式实现：（需在web文件夹```git init```,最好先手动执行一次```pull```）

在上述hooks目录中，创建post-receive文件，内容如下
~~~
#!/bin/sh
DEPLOY_PATH=/home/git/test.git #远程仓库目录

unset  GIT_DIR #这条命令很重要
cd $DEPLOY_PATH
git reset --hard  #强制刷新
git pull ~/test.git master #本地拉取直接写路径
chown git:git -R $DEPLOY_PATH
~~~
第二种方式实现：(压缩包形式，无需创建仓库)
~~~
#!/bin/sh
DEPLOY_PATH=/home/git/test.git

git archive --format zip --output /path/to/file.zip master # 将 master 以zip格式打包到指定文件（裸仓库中执行）  
mv /path/to/file.zip $DEPLOY_PATH #将打包好的剪切到web目录   
unset GIT_DIR  
cd $DEPLOY_PATH  
unzip -o file.zip #解压覆盖  
rm -rf file.zip #删除  
chown git:git -R $DEPLOY_PATH  
~~~
注意：要给钩子脚本执行的权限

---
到此为止，我们就可以尽情的享用git私服了，但是！但是！但是！客户端可以直接ssh登录啊，这是bug，也是不安全的隐患，且看下面怎么禁用git账号的shell登录。

### *禁止Git账号使用SSH登录

第一步：
给 /home/git 下面创建git-shell-commands目录，并把目录的拥有者设置为git账户。可以直接用git账号登录服务器终端操作。
~~~
$ su git
$ mkdir /home/git/git-shell-commands
此文件夹是git-shell用到的目录，需要我们手动创建。
~~~
第二步：修改/etc/passwd文件，修改
~~~
$ vim /etc/passwd

# 可以通过 vim的正则搜索快速定位到这行，  命名模式下  :/git:x

# 找到这句, 注意1000可能是别的数字
git:x:1000:1000::/home/git:/bin/bash

# 改为：
git:x:1000:1000::/home/git:/bin/git-shell

# 最好不要直接改，可以先复制一行，然后注释掉一行，修改一行，保留原始的，这就是经验！！！
# vim快捷键： 命令模式下：yy复制行， p 粘贴  0光标到行首 $到行尾 x删除一个字符  i进入插入模式 
# 修改完后退出保存：  esc进入命令模式， 输入：:wq!   保存退出。
~~~
好了，此时我们就不用担心客户端通过shell登录，只允许使用git-shell进行管理git的仓库。

如果有其他小伙伴要连接git服务器，仅需要把他的公钥也添加到authorized_keys即可。


>部分资料参考：   
[Linux环境下如何搭建Git服务器](https://blog.sbot.io/articles/13)  
[CensOS搭建Git服务器及权限管理](https://www.cnblogs.com/fly_dragon/p/8718614.html)










