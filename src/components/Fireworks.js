import React, { useEffect, useRef } from 'react';

const Fireworks = () => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let fireworks = [];
    let particles = [];
    
    // 设置canvas尺寸为窗口大小
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // 确保canvas覆盖整个视口
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.zIndex = '1001';
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // 烟花类
    class Firework {
      constructor() {
        // 随机决定烟花的起点位置（底部、左侧、右侧或顶部）
        const side = Math.random();
        if (side < 0.4) { // 底部发射 - 增加底部发射的概率
          this.x = Math.random() * canvas.width;
          this.y = canvas.height;
          // 目标位置在上半部分
          this.targetX = Math.random() * canvas.width;
          this.targetY = Math.random() * (canvas.height * 0.6);
        } else if (side < 0.65) { // 左侧发射
          this.x = 0;
          this.y = Math.random() * canvas.height * 0.8;
          // 目标位置在右半部分
          this.targetX = Math.random() * (canvas.width * 0.7) + (canvas.width * 0.3);
          this.targetY = Math.random() * (canvas.height * 0.7);
        } else if (side < 0.9) { // 右侧发射
          this.x = canvas.width;
          this.y = Math.random() * canvas.height * 0.8;
          // 目标位置在左半部分
          this.targetX = Math.random() * (canvas.width * 0.7);
          this.targetY = Math.random() * (canvas.height * 0.7);
        } else { // 顶部发射 - 少量从顶部发射
          this.x = Math.random() * canvas.width;
          this.y = 0;
          // 目标位置在中下部分
          this.targetX = Math.random() * canvas.width;
          this.targetY = canvas.height * (0.3 + Math.random() * 0.4);
        }
        
        // 速度和方向
        this.speed = Math.random() * 1 + 2.5; // 随机速度
        this.angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
        
        // 外观
        this.hue = Math.random() * 360;
        this.brightness = Math.random() * 50 + 50;
        this.color = `hsl(${this.hue}, 100%, 50%)`;
        this.radius = Math.random() * 1 + 1.5;
        
        // 尾迹
        this.trail = [];
        this.trailLength = Math.floor(Math.random() * 5) + 5;
        
        // 闪烁效果
        this.flicker = Math.random() > 0.5;
        this.flickerIntensity = Math.random() * 10 + 5;
        
        // 重力和摩擦力
        this.gravity = 0.02;
        this.friction = 0.99;
      }
      
      update() {
        // 保存尾迹
        this.trail.push([this.x, this.y]);
        if (this.trail.length > this.trailLength) {
          this.trail.shift();
        }
        
        // 应用摩擦力
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        // 应用重力
        this.vy += this.gravity;
        
        // 更新位置
        this.x += this.vx;
        this.y += this.vy;
        
        // 颜色变化
        if (this.flicker) {
          this.brightness = Math.max(0, Math.min(100, this.brightness + (Math.random() * this.flickerIntensity) - this.flickerIntensity / 2));
          this.color = `hsl(${this.hue}, 100%, ${this.brightness}%)`;
        }
        
        // 检查是否到达目标位置或超出屏幕
        if (this.y <= this.targetY || this.y >= canvas.height || this.x <= 0 || this.x >= canvas.width) {
          return true; // 返回true表示烟花需要爆炸
        }
        return false;
      }
      
      draw() {
        // 绘制烟花主体
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // 绘制尾迹
        for (let i = 0; i < this.trail.length; i++) {
          const [trailX, trailY] = this.trail[i];
          const alpha = i / this.trail.length;
          const size = this.radius * (alpha * 0.5 + 0.5); // 尾迹逐渐变小
          
          ctx.beginPath();
          ctx.arc(trailX, trailY, size, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, ${alpha})`;
          ctx.fill();
        }
        
        // 绘制光晕
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, 0.1)`;
        ctx.fill();
      }
    }
    
    // 粒子类
    class Particle {
      constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = Math.random() * 5 + 3; // 进一步增加粒子大小
        this.speed = Math.random() * 8 + 4; // 进一步增加粒子速度
        this.angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
        this.alpha = 1;
        this.decay = Math.random() * 0.015 + 0.003; // 进一步降低粒子消失速度
        this.friction = 0.985; // 减小摩擦力，使粒子飞得更远
        this.gravity = 0.03; // 减小重力效果
        this.hue = parseInt(color.match(/\d+/)[0]); // 提取色相值
        this.brightness = Math.random() * 20 + 95; // 进一步增加亮度
        this.trail = []; // 粒子轨迹
        this.trailLength = Math.floor(Math.random() * 8) + 5; // 进一步增加轨迹长度
        this.type = Math.random() > 0.3 ? 'circle' : 'star'; // 增加星形粒子的比例
        this.glow = Math.random() * 5 + 5; // 添加发光效果
      }
      
      update() {
        // 保存轨迹
        this.trail.push([this.x, this.y]);
        if (this.trail.length > this.trailLength) {
          this.trail.shift();
        }
        
        // 更新位置
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        
        // 颜色变化
        this.hue += 1;
        if (this.hue > 360) this.hue = 0;
        
        // 透明度衰减
        this.alpha -= this.decay;
        
        // 更新发光效果
        this.glow *= 0.99;
        
        return this.alpha <= 0; // 返回true表示粒子需要移除
      }
      
      draw() {
        // 绘制发光效果
        ctx.globalAlpha = this.alpha * 0.3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + this.glow, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, 0.3)`;
        ctx.fill();
        
        // 绘制轨迹
        for (let i = 0; i < this.trail.length; i++) {
          const [trailX, trailY] = this.trail[i];
          const alpha = (i / this.trail.length) * this.alpha * 0.7;
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(trailX, trailY, this.radius * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, 1)`;
          ctx.fill();
        }
        
        // 绘制粒子
        ctx.globalAlpha = this.alpha;
        
        if (this.type === 'circle') {
          // 绘制圆形粒子
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, 1)`;
          ctx.fill();
          
          // 添加高光
          ctx.beginPath();
          ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.3, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${this.hue}, 80%, 95%, ${this.alpha * 0.8})`;
          ctx.fill();
        } else {
          // 绘制星形
          this.drawStar(this.x, this.y, 5, this.radius, this.radius / 2);
        }
        
        ctx.globalAlpha = 1;
      }
      
      // 绘制星形
      drawStar(cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        let step = Math.PI / spikes;
        
        // 绘制星形发光效果
        ctx.globalAlpha = this.alpha * 0.4;
        ctx.beginPath();
        ctx.moveTo(cx, cy - (outerRadius + this.glow));
        for (let i = 0; i < spikes; i++) {
          x = cx + Math.cos(rot) * (outerRadius + this.glow);
          y = cy + Math.sin(rot) * (outerRadius + this.glow);
          ctx.lineTo(x, y);
          rot += step;

          x = cx + Math.cos(rot) * (innerRadius + this.glow * 0.5);
          y = cy + Math.sin(rot) * (innerRadius + this.glow * 0.5);
          ctx.lineTo(x, y);
          rot += step;
        }
        ctx.lineTo(cx, cy - (outerRadius + this.glow));
        ctx.closePath();
        ctx.fillStyle = `hsla(${this.hue}, 100%, ${this.brightness - 10}%, 0.4)`;
        ctx.fill();
        
        // 重置旋转角度
        rot = Math.PI / 2 * 3;
        
        // 绘制星形主体
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
          x = cx + Math.cos(rot) * outerRadius;
          y = cy + Math.sin(rot) * outerRadius;
          ctx.lineTo(x, y);
          rot += step;
          
          x = cx + Math.cos(rot) * innerRadius;
          y = cy + Math.sin(rot) * innerRadius;
          ctx.lineTo(x, y);
          rot += step;
        }
        
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fillStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, 1)`;
        ctx.fill();
        
        // 添加星形中心高光
        ctx.globalAlpha = this.alpha * 0.9;
        ctx.beginPath();
        ctx.arc(cx, cy, innerRadius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 80%, 95%, ${this.alpha * 0.8})`;
        ctx.fill();
      }
    }
    
    // 创建烟花
    const createFirework = () => {
      fireworks.push(new Firework());
    };
    
    // 创建爆炸效果
    function createExplosion(x, y, color, isMulticolor = true) { // 默认所有爆炸都是多彩的
      const particleCount = Math.floor(Math.random() * 150) + 100; // 进一步增加粒子数量
      for (let i = 0; i < particleCount; i++) {
        let particleColor = color;
        if (isMulticolor) {
          const hue = Math.floor(Math.random() * 360);
          particleColor = `hsl(${hue}, 100%, 60%)`;
        }
        particles.push(new Particle(x, y, particleColor));
      }
      
      // 添加二次爆炸效果
      if (Math.random() < 0.7) { // 70%概率产生二次爆炸
        setTimeout(() => {
          const secondaryCount = Math.floor(Math.random() * 50) + 30; // 增加二次爆炸粒子数量
          const distance = Math.random() * 50 + 30; // 增加二次爆炸距离
          const angle = Math.random() * Math.PI * 2;
          const secondaryX = x + Math.cos(angle) * distance;
          const secondaryY = y + Math.sin(angle) * distance;
          
          for (let i = 0; i < secondaryCount; i++) {
            let particleColor = color;
            if (isMulticolor) {
              const hue = Math.floor(Math.random() * 360);
              particleColor = `hsl(${hue}, 100%, 60%)`;
            }
            particles.push(new Particle(secondaryX, secondaryY, particleColor));
          }
          
          // 添加三次爆炸效果
          if (Math.random() < 0.5) { // 50%概率产生三次爆炸
            setTimeout(() => {
              const tertiaryCount = Math.floor(Math.random() * 40) + 20;
              const tertiaryDistance = Math.random() * 40 + 20;
              const tertiaryAngle = Math.random() * Math.PI * 2;
              const tertiaryX = secondaryX + Math.cos(tertiaryAngle) * tertiaryDistance;
              const tertiaryY = secondaryY + Math.sin(tertiaryAngle) * tertiaryDistance;
              
              for (let i = 0; i < tertiaryCount; i++) {
                let particleColor = color;
                if (isMulticolor) {
                  const hue = Math.floor(Math.random() * 360);
                  particleColor = `hsl(${hue}, 100%, 60%)`;
                }
                particles.push(new Particle(tertiaryX, tertiaryY, particleColor));
              }
            }, Math.random() * 150 + 100); // 延迟100-250ms
          }
        }, Math.random() * 200 + 100); // 延迟100-300ms
      }
    }
    
    // 动画循环
    const animate = () => {
      // 完全清空画布，不使用任何背景填充，确保不会变暗
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 随机生成新烟花，大幅增加生成概率
      if (Math.random() < 0.28) { // 进一步增加烟花生成概率
        createFirework();
      }
      
      // 如果烟花和粒子数量太少，额外生成一些
      if (fireworks.length + particles.length < 100) {
        if (Math.random() < 0.5) {
          createFirework();
        }
      }
      
      // 游戏开始时立即生成大量烟花，覆盖整个屏幕
      if (fireworks.length === 0 && particles.length === 0) {
        for (let i = 0; i < 30; i++) { // 进一步增加初始烟花数量
          createFirework();
        }
      }
      
      // 更新和绘制烟花
      for (let i = fireworks.length - 1; i >= 0; i--) {
        const shouldExplode = fireworks[i].update();
        fireworks[i].draw();
        
        if (shouldExplode) {
          createExplosion(fireworks[i].x, fireworks[i].y, fireworks[i].color);
          fireworks.splice(i, 1);
        }
      }
      
      // 更新和绘制粒子
      for (let i = particles.length - 1; i >= 0; i--) {
        const shouldRemove = particles[i].update();
        particles[i].draw();
        
        if (shouldRemove) {
          particles.splice(i, 1);
        }
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    // 启动动画
    animate();
    
    // 清理函数
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  
  return <canvas ref={canvasRef} id="fireworks" style={{ 
    position: 'fixed', 
    top: 0, 
    left: 0, 
    width: '100vw', 
    height: '100vh', 
    pointerEvents: 'none', 
    zIndex: 1001, 
    opacity: 1,
    display: 'block',
    backgroundColor: 'transparent'
  }} />;
};

export default Fireworks;