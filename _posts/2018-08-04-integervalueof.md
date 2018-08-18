---
layout: post
title: Java的Integer.valueOf()初窥
date: 2018-08-18
categories: blog
tags: [面试,Java,基础]
description: 文章金句。
---



# 前言
今天在做题时，碰到了一道选择题，就是关于Integer.valueOf()的知识，题目如下：
```
Integer i01 = 59;
int i02 = 59;
Integer i03 = Integer.valueOf(59);
Integer i04 = new Integer(59);

以下输出结果为false的是:

A.System.out.println(i01== i02);

B.System.out.println(i01== i03);

C.System.out.println(i03== i04);

D.System.out.println(i02== i04);
```

大家可以先想一想答案,暂时先不公布,我们慢慢开始分析~

# 分析

### 选项A

选项A中比较的是i01和i02，**Integer i01=59**这里涉及到自动装箱过程，59是整型常量，经包装使其产生一个引用并存在栈中指向这个整型常量所占的内存，这时i01就是Integer 的引用。

而**int i02=59**由于int是基本类型，所以不存在引用问题，直接由编译器将其存放在栈中，换一句话说，i02本身就是59。那么System.out.println(i01== i02)结果任何呢？这里涉及到了拆箱的过程，因为等号一边存在基本类型所以编译器后会把另一边的Integer对象拆箱成int型，这时等号两边比较的就是数值大小，所以是true。
>好了，到了这里，你有没有想到这样一个问题：如果是Integer i01=59；Integer i02=59；然后System.out.println(i01== i02)的结果是？可能你会说比较数值大小所以相等啊，也有可能说等号两边对象引用，所以比较的是引用，又因为开辟了不同的内存空间，所以引用不同所以返回false。可是正确答案是：true.  

>再来看这个问题：：如果是Integer i01=300；Integer i02=300；然后System.out.println(i01== i02)的结果是？ 你可能说上面你不是说了true嘛，怎么还问这样的问题，可是这次的答案是false。是不是很神奇~

  解析：当靠想象无法解决问题的时候，这是就要看源代码了！！很重要！我们可以在Integer类中找到这样的嵌套内部类IntegerCache：


```
 private static class IntegerCache {
        static final int low = -128;
        static final int high;
        static final Integer cache[];

        static {
            // high value may be configured by property
            int h = 127;
            String integerCacheHighPropValue =
                sun.misc.VM.getSavedProperty("java.lang.Integer.IntegerCache.high");
            if (integerCacheHighPropValue != null) {
                int i = parseInt(integerCacheHighPropValue);
                i = Math.max(i, 127);
                // Maximum array size is Integer.MAX_VALUE
                h = Math.min(i, Integer.MAX_VALUE - (-low) -1);
            }
            high = h;

            cache = new Integer[(high - low) + 1];
            int j = low;
            for(int k = 0; k < cache.length; k++)
                cache[k] = new Integer(j++);
        }

        private IntegerCache() {}
    }
```

 这个类就是在Integer类装入内存中时，会执行其内部类中静态代码块进行其初始化工作，做的主要工作就是把一字节的整型数据（-128-127）装包成Integer类并把其对应的引用存入到cache数组中，这样在方法区中开辟空间存放这些静态Integer变量，同时静态cache数组也存放在这里，供线程享用，这也称**静态缓存**。

  所以当用Integer 声明初始化变量时，会先判断所赋值的大小是否在-128到127之间，若在，则利用静态缓存中的空间并且返回对应cache数组中对应引用，存放到运行栈中，而不再重新开辟内存。

  所以对于**Integer i01=59**；**Integer i02=59**；i01 和 i02是引用并且相等都指向缓存中的数据，所以返回true。而对于**Integer i01=300**；**Integer i02=300**；因为其数据大于127，所以虚拟机会在堆中重新new （开辟新空间）一个 Integer 对象存放300，创建2个对象就会产生2个这样的空间，空间的地址肯定不同导致返回到栈中的引用的只不同。所以System.out.println打印出false。
  
  
>补充：为什么1个字节的数据范围是-128到127呢，因为Java中数据的表示都是带符号数，所以最高位是用来表示数据的正负，0表示正数，1表示负数，所以正数最大的情况对应的二进制数为：01111111，负数最小对应的二进制数为：10000000.

### 选项B

从上面的分析，我们已经知道**Integer i01=59**返回的是指向缓存数据的引用。那么**Integer.valueOf**返回的是什么或者操作是什么呢？

  这个函数的功能就是把int 型转换成Integer，简单说就是装包，那他是新创建一个对象吗？还是像之前利用缓存的呢？有了之前的经验，肯定想到的是利用缓存，这样做既提高程序速度，又节约内存，何乐而不为？  

来看一下源代码：
  
```
 public static Integer valueOf(int i) {
        assert IntegerCache.high >= 127;
        if (i >= IntegerCache.low && i <= IntegerCache.high)
            return IntegerCache.cache[i + (-IntegerCache.low)];
        return new Integer(i);
    }
```

很明显跟之前的思想一致，若在-128到127范围，直接返回该对象的引用，否则在堆中重新new 一个。

  到这，System.out.println(i01== i03)的结果毋庸置疑就是true.
  

### 选项C
**Integer.valueOf**返回的是已缓存的对象的引用，而<strong>Integer i04 = new Integer(59)</strong>是在堆中新开辟的空间，所以二者的引用的值必然不同，返回false,**这道题呢就选C**


### 选项D

<strong>System.out.println(i02== i04) </strong>i02是整型变量，i04是引用，这里又用到了解包，虚拟机会把i04指向的数据拆箱为整型变量再与之比较，所以比较的是数值，59==59，返回true.

# 思考

不得不服，Java这的设计真是巧妙，以后应多注意看看源码，其思想使我受益匪浅。

出一道题：
```
System.out.println(Integer.valueOf("127") == Integer.valueOf("127"));
System.out.println(Integer.valueOf("128") == Integer.valueOf("128"));
System.out.println(Integer.parseInt("128") == Integer.valueOf("128"));
```
输出结果如何？欢迎讨论~