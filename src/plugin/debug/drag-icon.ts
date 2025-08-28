// debugger icon的可拖拽
export default class DraggableButton {
  element: HTMLElement
  isDragging: boolean
  animationFrameId: any
  lastX: number
  lastY: number
  offsetX: number
  offsetY: number
  initialX: number
  initialY: number
  clickAllowed: boolean
  dragThreshold: number
  constructor(element: HTMLElement) {
    this.element = element;
    this.isDragging = false;
    this.animationFrameId = null;
    this.lastX = 0;
    this.lastY = 0;
    this.initialX = 0;  // 元素初始X坐标
    this.initialY = 0;  // 元素初始Y坐标
    this.offsetX = 0;
    this.offsetY = 0;
    this.clickAllowed = true;
    this.dragThreshold = 1; // 移动超过5px视为拖拽
    this.initPosition();
    this.bindEvents();
    this.bindClickHandler();
  }
  // 初始化元素定位方式
  initPosition() {
    const rect = this.element.getBoundingClientRect();
    this.element.style.position = 'fixed';
    this.element.style.left = `${rect.left}px`;
    this.element.style.top = `${rect.top}px`;
    this.element.style.transform = 'translate(0, 0)';
  }
  bindEvents() {
    this.element.addEventListener('mousedown', this.onStart.bind(this));
    this.element.addEventListener('touchstart', this.onStart.bind(this));
  }

  onStart(e) {
    e.preventDefault();
    this.initialX = e.clientX || e.touches[0].clientX;
    this.initialY = e.clientY || e.touches[0].clientY;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    // 获取元素当前实际位置（包含transform）
    const rect = this.element.getBoundingClientRect();
    this.initialX = rect.left;
    this.initialY = rect.top;

    // 计算点击位置偏移量
    this.offsetX = clientX - this.initialX;
    this.offsetY = clientY - this.initialY;
    this.clickAllowed = true;
    this.isDragging = true;
    document.addEventListener('mousemove', this.onMove);
    document.addEventListener('mouseup', this.onEnd);
    document.addEventListener('touchmove', this.onMove);
    document.addEventListener('touchend', this.onEnd);
  }

  onMove = (e) => {
    if (!this.isDragging) return;

    // 判断是否达到拖拽阈值
    const currentX = e.clientX || e.touches[0].clientX;
    const currentY = e.clientY || e.touches[0].clientY;

    if (this.clickAllowed) {
      const deltaX = Math.abs(currentX - this.initialX);
      const deltaY = Math.abs(currentY - this.initialY);

      if (deltaX > this.dragThreshold || deltaY > this.dragThreshold) {
        this.clickAllowed = false;
      }
    }

    // 节流处理
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.animationFrameId = requestAnimationFrame(() => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      // 计算新位置
      let newX = clientX - this.offsetX;
      let newY = clientY - this.offsetY;

      // 边界限制
      const maxX = window.innerWidth - this.element.offsetWidth;
      const maxY = window.innerHeight - this.element.offsetHeight;
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));

      // 直接应用transform（不修改left/top）
      this.element.style.transform = `translate(
        ${newX - this.initialX}px, 
        ${newY - this.initialY}px
      )`;
    });
  }

  onEnd = () => {
    if (!this.isDragging) return;
    this.isDragging = false;

    // 将最终位置同步到left/top
    const matrix = new DOMMatrix(getComputedStyle(this.element).transform);
    const finalX = this.initialX + matrix.m41;
    const finalY = this.initialY + matrix.m42;

    this.element.style.left = `${finalX}px`;
    this.element.style.top = `${finalY}px`;
    this.element.style.transform = 'none';

    // 更新初始位置记录
    this.initialX = finalX;
    this.initialY = finalY;

    // 清理事件监听
    document.removeEventListener('mousemove', this.onMove);
    document.removeEventListener('mouseup', this.onEnd);
    document.removeEventListener('touchmove', this.onMove);
    document.removeEventListener('touchend', this.onEnd);

    setTimeout(() => {
      this.clickAllowed = true;
    }, 50);
  }
  // 修改后的点击事件绑定方式
  bindClickHandler() {
    this.element.addEventListener('click', (e) => {
      if (!this.clickAllowed) {
        e.stopImmediatePropagation();
        e.preventDefault();
        return;
      }
      // 原有的点击处理逻辑
      window && window.postMessage({
        type: 'devtool:web:open-draw',
      }, location.origin);
    });
  }
}