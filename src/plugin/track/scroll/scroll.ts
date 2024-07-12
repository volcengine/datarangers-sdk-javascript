
enum ScrollTypeE {
  SCROLL_UP = 1, // 向上滚动
  SCROLL_DOWN = 2, // 向下滚动
  SCROLL_LEFT = 3, // 向左滚动
  SCROLL_RIGHT = 4, // 向右滚动
  NOT_SCROLL = -1,
}
class ScrollSlide {
  eventHandle: any
  distance: number = 30
  scrollType: string
  constructor(config: any, eventHandle: any) {
    if (!config.autotrack || !config.autotrack.scroll) return;
    if (config.autotrack.scroll.distance) {
      this.distance = config.autotrack.scroll.distance;
    }
    this.eventHandle = eventHandle;
    this.addLinstenr();
    this.mutation();
  }

  addLinstenr() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-scroll]'), (dom: HTMLElement) => {
      this.scrollHandle(dom)
    });
  }
  mutation() {
    if (window['MutationObserver']) {
      try {
        const instance = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            // 更新dom节点可能是update，只是属性改变，需要监听
            // if (mutation.type === 'attributes') {
            //   this.attributeChangeObserve(mutation);
            // }
            // dom节点变化
            if (mutation.type === 'childList') {
              this.modifyNodeObserve(mutation);
            }
          });
        });
        if (!document || !document.body) {
          console.warn('please use sdk api init after body element')
          return
        }
        instance.observe(document.body, {
          childList: true, 
          attributes: true, 
          subtree: true, 
          attributeOldValue: false,
        });
      } catch (e) {
        console.log('your browser cannot support MutationObserver')
      }
    } else {
      console.log('your browser cannot support MutationObserver')
    }
  }
  // 监听dom属性变化添加或删除节点曝光监听
  // attributeChangeObserve(mutation) {
  //   const dom = mutation.target;
  //   if (dom.hasAttribute('data-scroll')) {
  //     this.scrollHandle(mutation);
  //   }
  // }

  // 监听dom变化添加或删除节点曝光监听
  modifyNodeObserve(mutation) {
    // 不能为文本节点&&要有auto-exp属性
    Array.prototype.forEach.call(mutation.addedNodes, (node) => {
      if (node.nodeType === 1 && node.hasAttribute('data-scroll')) {
        this.scrollHandle(node);
      }
      this.mapChild(node, this.scrollHandle.bind(this));
    });

    // 遍历子节点的删除
    Array.prototype.forEach.call(mutation.removedNodes, (node) => {
      if (node.nodeType === 1 && node.hasAttribute('data-scroll')) {
        this.scrollHandle(node, 'remove');
      }
      this.mapChild(node, this.scrollHandle.bind(this));
    })
  }

  // 递归后代节点
  mapChild(node, action) {
    if (node.nodeType !== 1) {
      return;
    }
    if (!node.children.length) {
      return;
    }

    Array.prototype.forEach.call(node.children, (item) => {
      if (item.nodeType === 1 && item.hasAttribute('data-scroll')) {
        action(item);
      }
      this.mapChild(item, action);
    });
  }
  scrollHandle(dom: HTMLElement, type?: string) {
    try {
      let preScrollTop = dom.scrollTop;
      let preScrollLeft = dom.scrollLeft;
      let timer: any = null;
      let $offsetX = 0;
      let $offsetY = 0;
      const scrollFn = (e: Event) => {
        clearTimeout(timer)
        timer = setTimeout(() => {
          let finalScrollTop = dom.scrollTop;
          let finalScrollLeft = dom.scrollLeft;
          const event = e.target && e.target['getAttribute']('data-scroll-event') || '';
          if (scrollDirection === 1 || scrollDirection === 2) {
            if (finalScrollTop === currentScrollTop) {
              // 滚动停止了
              $offsetY = currentScrollTop - preScrollTop;
              if (Math.abs($offsetY) >= this.distance && this.distance) {
                this.eventHandle({ eventType: 'dom', eventName: 'scroll', event, params: { $direction: scrollDirection, $offsetY, $offsetX } }, e)
              }
            }
          } else if (scrollDirection === 3 || scrollDirection === 4) {
            if (finalScrollLeft === currentScrollLeft) {
              // 滚动停止了
              $offsetX = currentScrollLeft - preScrollLeft;
              if (Math.abs($offsetX) >= this.distance && this.distance) {
                this.eventHandle({ eventType: 'dom', eventName: 'scroll', event, params: { $direction: scrollDirection, $offsetY, $offsetX } }, e)
              }
            }
          }
          preScrollTop = currentScrollTop;
          preScrollLeft = currentScrollLeft;
        }, 100)
        let currentScrollTop = dom.scrollTop;
        let currentScrollLeft = dom.scrollLeft;
        let scrollDirection = ScrollTypeE.NOT_SCROLL;
        if (currentScrollTop > preScrollTop) {
          scrollDirection = ScrollTypeE.SCROLL_DOWN
        } else if (currentScrollTop < preScrollTop) {
          scrollDirection = ScrollTypeE.SCROLL_UP
        } else {
          if (currentScrollLeft > preScrollLeft) {
            scrollDirection = ScrollTypeE.SCROLL_LEFT
          } else if (currentScrollLeft < preScrollLeft) {
            scrollDirection = ScrollTypeE.SCROLL_RIGHT
          }
        }
      }
      if (type === 'remove') {
        dom.removeEventListener('scroll', scrollFn, false)
      } else {
        dom.addEventListener('scroll', scrollFn, false)
      }
      return () => {
        dom.removeEventListener('scroll', scrollFn, false)
      }
    } catch (e) {
      console.warn('scroll event error', JSON.stringify(e))
    }

  }
}
export default ScrollSlide
