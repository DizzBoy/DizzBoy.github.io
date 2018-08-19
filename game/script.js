$(function () {
    var numpool = {
        pool: [],       //数组
        isNew: true,    //是否为新数组
        score: 0        //分数
    };

    //初始化
    function initNumpool() {
        numpool.pool.length = 0;
        for (var i = 0; i < 16; i++) {
            numpool.pool.push(0);
        }
        numpool.isNew = true;
        numpool.score = 0;
    }

    //生成新数块---index:一次生成的个数
    function generateBlock(index) {
        while (index !== 0) {
            var pos = parseInt(Math.random() * 16);
            if (numpool.pool[pos] === 0) {
                numpool.pool[pos] = 2;
                index--;
            }
        }
    }

    //返回数块对应的颜色
    function colorPattern(index) {
        if(index===2)
            return "#f2e4da";
        else if(index===4)
            return "#f2e0c7";
        else if(index===8)
            return "#FFAD75";
        else if(index===16)
            return "#FF8F5C";
        else if(index===32)
            return "#FF7355";
        else if(index===64)
            return "#FF5229";
        else if(index>=128)
            return "#f6ce71";
    }

    //渲染主体界面
    function generatePage() {
        for (var i = 0; i < 16; i++) {
            var $div = $('<div></div>');
            var left = ((i + 1) % 4 === 0 ? 4 : (i + 1) % 4) * 10 + (((i + 1) % 4 === 0 ? 4 : (i + 1) % 4) - 1) * 50;
            var top = (parseInt(i / 4) + 1) * 10 + parseInt(i / 4) * 50;
            $div.css("left", left + "px").css("top", top + "px");
            $('#main').append($div);
        }

    }

    //渲染画面
    function drawToPage() {
        numpool.pool.forEach(function (value, index) {
            if (value !== 0) {
                $('div:eq(' + index + ')')
                    .html(value)
                    .css("background-color", colorPattern(value))
                    .css("border-width", '0')
                    .css("font-size", "30px")
                    .css("line-height", "50px");
                if(value<=4)
                    $('div:eq(' + index + ')').css('color','#796d64');
                else
                    $('div:eq(' + index + ')').css('color','#fbf7f3');
            } else {
                $('div:eq(' + index + ')')
                    .html('')
                    .css("background-color", '#d0c0b3')
                    .css("border-width", "20px")
                    .css("font-size", "5px")
                    .css("line-height", "unset")
            }
        })
    }

    function newGame() {
        setTimeout(function () {
            initNumpool();
            generateBlock(2);
            drawToPage();
        }, 1);
    }

    //移动方块 code---->方向指令 1:top 2:right 3:down 4:left
    function moveBlocks(code) {
        for (var i = 0; i < 4; i++) {
            //取出与指令方向相反的纵列坐标数组
            var tempNum;
            //不同的方向对应不同的pattern
            if (code === 1)
                tempNum = [i, 4 + i, 8 + i, 12 + i];
            else if (code === 2)
                tempNum = [4 * i + 3, 4 * i + 2, 4 * i + 1, 4 * i];
            else if (code === 3)
                tempNum = [12 + i, 8 + i, 4 + i, i];
            else
                tempNum = [4 * i, 4 * i + 1, 4 * i + 2, 4 * i + 3];
            //制作合并后的真实数纵
            var realValues = [];
            tempNum.forEach(function (value) {
                realValues.push(numpool.pool[value]);
            });

            //从上往下搜索,类似与冒泡排序
            realValues.forEach(function (value, index) {//index-->0,1,2,3
                //若真实值不等于0,则进入匹配,即跳过空格
                if (value !== 0) {
                    //i-->对比者之后的所有坐标在tempNum中的Index
                    for (var i = index + 1; i < 4; i++) {
                        //相邻合并
                        if (value === realValues[index + 1]) {
                            realValues[index] = value * 2;//对比格*2
                            realValues[index + 1] = 0;//匹配格擦除
                            break;
                        }
                        //间隔1格
                        if (i !== 3 && realValues[index + 1] === 0 &&
                            realValues[index + 2] === value) {
                            realValues[index] = value * 2;
                            realValues[index + 2] = 0;
                            break;
                        }
                        //间隔2格---最大间隔情况
                        if (i === 1 && realValues[index + 1] === 0 &&
                            realValues[index + 2] === 0 &&
                            value === realValues[index + 3]) {
                            realValues[index] = value * 2;
                            realValues[index + 3] = 0;
                            break;
                        }
                    }
                }
            });

            //搜索完毕后进行去空格
            //-->删除所有0
            while (realValues.indexOf(0) !== -1)
                realValues.splice(realValues.indexOf(0), 1);
            //-->给后面补上0
            while (realValues.length < 4)
                realValues.push(0);
            //-->最后赋给原始数组
            tempNum.forEach(function (value, index) {
                numpool.pool[value] = realValues[index];
            })
        }
        generateBlock(1);
        drawToPage()
    }

    generatePage();
    newGame();

    document.onkeydown = function (event) {
        var e = event || window.event || arguments.callee.caller.arguments[0];
        if (e && e.keyCode === 38)
            moveBlocks(1);
        if (e && e.keyCode === 39)
            moveBlocks(2);
        if (e && e.keyCode === 40)
            moveBlocks(3);
        if (e && e.keyCode === 37)
            moveBlocks(4);
    };
});
