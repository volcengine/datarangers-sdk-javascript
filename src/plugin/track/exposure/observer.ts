// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.

// 监视曝光的上层类 处理动态dom
export default class Observer {

  static _exposure_observer = null;
  _instance: any
  _intersection: any
  constructor(intersection: any) {
    this._instance = null;
    this._intersection = intersection;
    if (!this._intersection) return;
    this.init();
  }

  // 初始化mutation对象观察动态dom
  init() {
    if (MutationObserver) {
      this._instance = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          // 更新dom节点可能是update，只是属性改变，需要监听
          if (mutation.type === 'attributes') {
            this.attributeChangeObserve(mutation);
          }
          // dom节点变化
          if (mutation.type === 'childList') {
            this.modifyNodeObserve(mutation);
          }
        });
      });

      this._instance.observe(document.body, {
        childList: true, attributes: true, subtree: true, attributeOldValue: false,
      });
    } else {
      console.log('your browser cannot support MutationObserver')
    }
  }


  // 监听dom属性变化添加或删除节点曝光监听
  attributeChangeObserve(mutation) {
    const dom = mutation.target;
    if (dom.hasAttribute('data-exposure')) {
      this.exposureAdd(mutation, 'mutation');
    } else {
      this.exposureRemove(mutation);
    }
  }

  // 监听dom变化添加或删除节点曝光监听
  modifyNodeObserve(mutation) {
    // 不能为文本节点&&要有auto-exp属性
    Array.prototype.forEach.call(mutation.addedNodes, (node) => {
      if (node.nodeType === 1 && node.hasAttribute('data-exposure')) {
        this.exposureAdd(node, 'intersect');
      }

      this.mapChild(node, this.exposureAdd);
    });

    // 遍历子节点的删除
    Array.prototype.forEach.call(mutation.removedNodes, (node) => {
      if (node.nodeType === 1 && node.hasAttribute('data-exposure')) {
        this.exposureRemove(node);
      }
      this.mapChild(node, this.exposureRemove);
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
      if (item.nodeType === 1 && item.hasAttribute('data-exposure')) {
        action(item);
      }
      this.mapChild(item, action);
    });
  }

  // 添加进入曝光队列
  exposureAdd(dom: Element, type: string) {
    try {
      this._intersection && this._intersection.exposureAdd(dom, type);
    } catch (e) {
      console.log('intersection error', JSON.stringify(e.message))
    }

  }

  // 从曝光队列中移除
  exposureRemove(dom: Element) {
    try {
      this._intersection && this._intersection.exposureRemove(dom);
    } catch (e) {
      console.log('intersection error', JSON.stringify(e.message))
    }
  }

}