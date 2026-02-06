var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);

// node_modules/@xterm/xterm/lib/xterm.js
var require_xterm = __commonJS((exports, module) => {
  (function(e, t) {
    if (typeof exports == "object" && typeof module == "object")
      module.exports = t();
    else if (typeof define == "function" && define.amd)
      define([], t);
    else {
      var i = t();
      for (var s in i)
        (typeof exports == "object" ? exports : e)[s] = i[s];
    }
  })(globalThis, () => (() => {
    var e = { 4567: function(e2, t2, i2) {
      var s2 = this && this.__decorate || function(e3, t3, i3, s3) {
        var r2, n2 = arguments.length, o2 = n2 < 3 ? t3 : s3 === null ? s3 = Object.getOwnPropertyDescriptor(t3, i3) : s3;
        if (typeof Reflect == "object" && typeof Reflect.decorate == "function")
          o2 = Reflect.decorate(e3, t3, i3, s3);
        else
          for (var a2 = e3.length - 1;a2 >= 0; a2--)
            (r2 = e3[a2]) && (o2 = (n2 < 3 ? r2(o2) : n2 > 3 ? r2(t3, i3, o2) : r2(t3, i3)) || o2);
        return n2 > 3 && o2 && Object.defineProperty(t3, i3, o2), o2;
      }, r = this && this.__param || function(e3, t3) {
        return function(i3, s3) {
          t3(i3, s3, e3);
        };
      };
      Object.defineProperty(t2, "__esModule", { value: true }), t2.AccessibilityManager = undefined;
      const n = i2(9042), o = i2(9924), a = i2(844), h = i2(4725), c = i2(2585), l = i2(3656);
      let d = t2.AccessibilityManager = class extends a.Disposable {
        constructor(e3, t3, i3, s3) {
          super(), this._terminal = e3, this._coreBrowserService = i3, this._renderService = s3, this._rowColumns = new WeakMap, this._liveRegionLineCount = 0, this._charsToConsume = [], this._charsToAnnounce = "", this._accessibilityContainer = this._coreBrowserService.mainDocument.createElement("div"), this._accessibilityContainer.classList.add("xterm-accessibility"), this._rowContainer = this._coreBrowserService.mainDocument.createElement("div"), this._rowContainer.setAttribute("role", "list"), this._rowContainer.classList.add("xterm-accessibility-tree"), this._rowElements = [];
          for (let e4 = 0;e4 < this._terminal.rows; e4++)
            this._rowElements[e4] = this._createAccessibilityTreeNode(), this._rowContainer.appendChild(this._rowElements[e4]);
          if (this._topBoundaryFocusListener = (e4) => this._handleBoundaryFocus(e4, 0), this._bottomBoundaryFocusListener = (e4) => this._handleBoundaryFocus(e4, 1), this._rowElements[0].addEventListener("focus", this._topBoundaryFocusListener), this._rowElements[this._rowElements.length - 1].addEventListener("focus", this._bottomBoundaryFocusListener), this._refreshRowsDimensions(), this._accessibilityContainer.appendChild(this._rowContainer), this._liveRegion = this._coreBrowserService.mainDocument.createElement("div"), this._liveRegion.classList.add("live-region"), this._liveRegion.setAttribute("aria-live", "assertive"), this._accessibilityContainer.appendChild(this._liveRegion), this._liveRegionDebouncer = this.register(new o.TimeBasedDebouncer(this._renderRows.bind(this))), !this._terminal.element)
            throw new Error("Cannot enable accessibility before Terminal.open");
          this._terminal.element.insertAdjacentElement("afterbegin", this._accessibilityContainer), this.register(this._terminal.onResize((e4) => this._handleResize(e4.rows))), this.register(this._terminal.onRender((e4) => this._refreshRows(e4.start, e4.end))), this.register(this._terminal.onScroll(() => this._refreshRows())), this.register(this._terminal.onA11yChar((e4) => this._handleChar(e4))), this.register(this._terminal.onLineFeed(() => this._handleChar(`
`))), this.register(this._terminal.onA11yTab((e4) => this._handleTab(e4))), this.register(this._terminal.onKey((e4) => this._handleKey(e4.key))), this.register(this._terminal.onBlur(() => this._clearLiveRegion())), this.register(this._renderService.onDimensionsChange(() => this._refreshRowsDimensions())), this.register((0, l.addDisposableDomListener)(document, "selectionchange", () => this._handleSelectionChange())), this.register(this._coreBrowserService.onDprChange(() => this._refreshRowsDimensions())), this._refreshRows(), this.register((0, a.toDisposable)(() => {
            this._accessibilityContainer.remove(), this._rowElements.length = 0;
          }));
        }
        _handleTab(e3) {
          for (let t3 = 0;t3 < e3; t3++)
            this._handleChar(" ");
        }
        _handleChar(e3) {
          this._liveRegionLineCount < 21 && (this._charsToConsume.length > 0 ? this._charsToConsume.shift() !== e3 && (this._charsToAnnounce += e3) : this._charsToAnnounce += e3, e3 === `
` && (this._liveRegionLineCount++, this._liveRegionLineCount === 21 && (this._liveRegion.textContent += n.tooMuchOutput)));
        }
        _clearLiveRegion() {
          this._liveRegion.textContent = "", this._liveRegionLineCount = 0;
        }
        _handleKey(e3) {
          this._clearLiveRegion(), /\p{Control}/u.test(e3) || this._charsToConsume.push(e3);
        }
        _refreshRows(e3, t3) {
          this._liveRegionDebouncer.refresh(e3, t3, this._terminal.rows);
        }
        _renderRows(e3, t3) {
          const i3 = this._terminal.buffer, s3 = i3.lines.length.toString();
          for (let r2 = e3;r2 <= t3; r2++) {
            const e4 = i3.lines.get(i3.ydisp + r2), t4 = [], n2 = e4?.translateToString(true, undefined, undefined, t4) || "", o2 = (i3.ydisp + r2 + 1).toString(), a2 = this._rowElements[r2];
            a2 && (n2.length === 0 ? (a2.innerText = " ", this._rowColumns.set(a2, [0, 1])) : (a2.textContent = n2, this._rowColumns.set(a2, t4)), a2.setAttribute("aria-posinset", o2), a2.setAttribute("aria-setsize", s3));
          }
          this._announceCharacters();
        }
        _announceCharacters() {
          this._charsToAnnounce.length !== 0 && (this._liveRegion.textContent += this._charsToAnnounce, this._charsToAnnounce = "");
        }
        _handleBoundaryFocus(e3, t3) {
          const i3 = e3.target, s3 = this._rowElements[t3 === 0 ? 1 : this._rowElements.length - 2];
          if (i3.getAttribute("aria-posinset") === (t3 === 0 ? "1" : `${this._terminal.buffer.lines.length}`))
            return;
          if (e3.relatedTarget !== s3)
            return;
          let r2, n2;
          if (t3 === 0 ? (r2 = i3, n2 = this._rowElements.pop(), this._rowContainer.removeChild(n2)) : (r2 = this._rowElements.shift(), n2 = i3, this._rowContainer.removeChild(r2)), r2.removeEventListener("focus", this._topBoundaryFocusListener), n2.removeEventListener("focus", this._bottomBoundaryFocusListener), t3 === 0) {
            const e4 = this._createAccessibilityTreeNode();
            this._rowElements.unshift(e4), this._rowContainer.insertAdjacentElement("afterbegin", e4);
          } else {
            const e4 = this._createAccessibilityTreeNode();
            this._rowElements.push(e4), this._rowContainer.appendChild(e4);
          }
          this._rowElements[0].addEventListener("focus", this._topBoundaryFocusListener), this._rowElements[this._rowElements.length - 1].addEventListener("focus", this._bottomBoundaryFocusListener), this._terminal.scrollLines(t3 === 0 ? -1 : 1), this._rowElements[t3 === 0 ? 1 : this._rowElements.length - 2].focus(), e3.preventDefault(), e3.stopImmediatePropagation();
        }
        _handleSelectionChange() {
          if (this._rowElements.length === 0)
            return;
          const e3 = document.getSelection();
          if (!e3)
            return;
          if (e3.isCollapsed)
            return void (this._rowContainer.contains(e3.anchorNode) && this._terminal.clearSelection());
          if (!e3.anchorNode || !e3.focusNode)
            return void console.error("anchorNode and/or focusNode are null");
          let t3 = { node: e3.anchorNode, offset: e3.anchorOffset }, i3 = { node: e3.focusNode, offset: e3.focusOffset };
          if ((t3.node.compareDocumentPosition(i3.node) & Node.DOCUMENT_POSITION_PRECEDING || t3.node === i3.node && t3.offset > i3.offset) && ([t3, i3] = [i3, t3]), t3.node.compareDocumentPosition(this._rowElements[0]) & (Node.DOCUMENT_POSITION_CONTAINED_BY | Node.DOCUMENT_POSITION_FOLLOWING) && (t3 = { node: this._rowElements[0].childNodes[0], offset: 0 }), !this._rowContainer.contains(t3.node))
            return;
          const s3 = this._rowElements.slice(-1)[0];
          if (i3.node.compareDocumentPosition(s3) & (Node.DOCUMENT_POSITION_CONTAINED_BY | Node.DOCUMENT_POSITION_PRECEDING) && (i3 = { node: s3, offset: s3.textContent?.length ?? 0 }), !this._rowContainer.contains(i3.node))
            return;
          const r2 = ({ node: e4, offset: t4 }) => {
            const i4 = e4 instanceof Text ? e4.parentNode : e4;
            let s4 = parseInt(i4?.getAttribute("aria-posinset"), 10) - 1;
            if (isNaN(s4))
              return console.warn("row is invalid. Race condition?"), null;
            const r3 = this._rowColumns.get(i4);
            if (!r3)
              return console.warn("columns is null. Race condition?"), null;
            let n3 = t4 < r3.length ? r3[t4] : r3.slice(-1)[0] + 1;
            return n3 >= this._terminal.cols && (++s4, n3 = 0), { row: s4, column: n3 };
          }, n2 = r2(t3), o2 = r2(i3);
          if (n2 && o2) {
            if (n2.row > o2.row || n2.row === o2.row && n2.column >= o2.column)
              throw new Error("invalid range");
            this._terminal.select(n2.column, n2.row, (o2.row - n2.row) * this._terminal.cols - n2.column + o2.column);
          }
        }
        _handleResize(e3) {
          this._rowElements[this._rowElements.length - 1].removeEventListener("focus", this._bottomBoundaryFocusListener);
          for (let e4 = this._rowContainer.children.length;e4 < this._terminal.rows; e4++)
            this._rowElements[e4] = this._createAccessibilityTreeNode(), this._rowContainer.appendChild(this._rowElements[e4]);
          for (;this._rowElements.length > e3; )
            this._rowContainer.removeChild(this._rowElements.pop());
          this._rowElements[this._rowElements.length - 1].addEventListener("focus", this._bottomBoundaryFocusListener), this._refreshRowsDimensions();
        }
        _createAccessibilityTreeNode() {
          const e3 = this._coreBrowserService.mainDocument.createElement("div");
          return e3.setAttribute("role", "listitem"), e3.tabIndex = -1, this._refreshRowDimensions(e3), e3;
        }
        _refreshRowsDimensions() {
          if (this._renderService.dimensions.css.cell.height) {
            this._accessibilityContainer.style.width = `${this._renderService.dimensions.css.canvas.width}px`, this._rowElements.length !== this._terminal.rows && this._handleResize(this._terminal.rows);
            for (let e3 = 0;e3 < this._terminal.rows; e3++)
              this._refreshRowDimensions(this._rowElements[e3]);
          }
        }
        _refreshRowDimensions(e3) {
          e3.style.height = `${this._renderService.dimensions.css.cell.height}px`;
        }
      };
      t2.AccessibilityManager = d = s2([r(1, c.IInstantiationService), r(2, h.ICoreBrowserService), r(3, h.IRenderService)], d);
    }, 3614: (e2, t2) => {
      function i2(e3) {
        return e3.replace(/\r?\n/g, "\r");
      }
      function s2(e3, t3) {
        return t3 ? "\x1B[200~" + e3 + "\x1B[201~" : e3;
      }
      function r(e3, t3, r2, n2) {
        e3 = s2(e3 = i2(e3), r2.decPrivateModes.bracketedPasteMode && n2.rawOptions.ignoreBracketedPasteMode !== true), r2.triggerDataEvent(e3, true), t3.value = "";
      }
      function n(e3, t3, i3) {
        const s3 = i3.getBoundingClientRect(), r2 = e3.clientX - s3.left - 10, n2 = e3.clientY - s3.top - 10;
        t3.style.width = "20px", t3.style.height = "20px", t3.style.left = `${r2}px`, t3.style.top = `${n2}px`, t3.style.zIndex = "1000", t3.focus();
      }
      Object.defineProperty(t2, "__esModule", { value: true }), t2.rightClickHandler = t2.moveTextAreaUnderMouseCursor = t2.paste = t2.handlePasteEvent = t2.copyHandler = t2.bracketTextForPaste = t2.prepareTextForTerminal = undefined, t2.prepareTextForTerminal = i2, t2.bracketTextForPaste = s2, t2.copyHandler = function(e3, t3) {
        e3.clipboardData && e3.clipboardData.setData("text/plain", t3.selectionText), e3.preventDefault();
      }, t2.handlePasteEvent = function(e3, t3, i3, s3) {
        e3.stopPropagation(), e3.clipboardData && r(e3.clipboardData.getData("text/plain"), t3, i3, s3);
      }, t2.paste = r, t2.moveTextAreaUnderMouseCursor = n, t2.rightClickHandler = function(e3, t3, i3, s3, r2) {
        n(e3, t3, i3), r2 && s3.rightClickSelect(e3), t3.value = s3.selectionText, t3.select();
      };
    }, 7239: (e2, t2, i2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.ColorContrastCache = undefined;
      const s2 = i2(1505);
      t2.ColorContrastCache = class {
        constructor() {
          this._color = new s2.TwoKeyMap, this._css = new s2.TwoKeyMap;
        }
        setCss(e3, t3, i3) {
          this._css.set(e3, t3, i3);
        }
        getCss(e3, t3) {
          return this._css.get(e3, t3);
        }
        setColor(e3, t3, i3) {
          this._color.set(e3, t3, i3);
        }
        getColor(e3, t3) {
          return this._color.get(e3, t3);
        }
        clear() {
          this._color.clear(), this._css.clear();
        }
      };
    }, 3656: (e2, t2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.addDisposableDomListener = undefined, t2.addDisposableDomListener = function(e3, t3, i2, s2) {
        e3.addEventListener(t3, i2, s2);
        let r = false;
        return { dispose: () => {
          r || (r = true, e3.removeEventListener(t3, i2, s2));
        } };
      };
    }, 3551: function(e2, t2, i2) {
      var s2 = this && this.__decorate || function(e3, t3, i3, s3) {
        var r2, n2 = arguments.length, o2 = n2 < 3 ? t3 : s3 === null ? s3 = Object.getOwnPropertyDescriptor(t3, i3) : s3;
        if (typeof Reflect == "object" && typeof Reflect.decorate == "function")
          o2 = Reflect.decorate(e3, t3, i3, s3);
        else
          for (var a2 = e3.length - 1;a2 >= 0; a2--)
            (r2 = e3[a2]) && (o2 = (n2 < 3 ? r2(o2) : n2 > 3 ? r2(t3, i3, o2) : r2(t3, i3)) || o2);
        return n2 > 3 && o2 && Object.defineProperty(t3, i3, o2), o2;
      }, r = this && this.__param || function(e3, t3) {
        return function(i3, s3) {
          t3(i3, s3, e3);
        };
      };
      Object.defineProperty(t2, "__esModule", { value: true }), t2.Linkifier = undefined;
      const n = i2(3656), o = i2(8460), a = i2(844), h = i2(2585), c = i2(4725);
      let l = t2.Linkifier = class extends a.Disposable {
        get currentLink() {
          return this._currentLink;
        }
        constructor(e3, t3, i3, s3, r2) {
          super(), this._element = e3, this._mouseService = t3, this._renderService = i3, this._bufferService = s3, this._linkProviderService = r2, this._linkCacheDisposables = [], this._isMouseOut = true, this._wasResized = false, this._activeLine = -1, this._onShowLinkUnderline = this.register(new o.EventEmitter), this.onShowLinkUnderline = this._onShowLinkUnderline.event, this._onHideLinkUnderline = this.register(new o.EventEmitter), this.onHideLinkUnderline = this._onHideLinkUnderline.event, this.register((0, a.getDisposeArrayDisposable)(this._linkCacheDisposables)), this.register((0, a.toDisposable)(() => {
            this._lastMouseEvent = undefined, this._activeProviderReplies?.clear();
          })), this.register(this._bufferService.onResize(() => {
            this._clearCurrentLink(), this._wasResized = true;
          })), this.register((0, n.addDisposableDomListener)(this._element, "mouseleave", () => {
            this._isMouseOut = true, this._clearCurrentLink();
          })), this.register((0, n.addDisposableDomListener)(this._element, "mousemove", this._handleMouseMove.bind(this))), this.register((0, n.addDisposableDomListener)(this._element, "mousedown", this._handleMouseDown.bind(this))), this.register((0, n.addDisposableDomListener)(this._element, "mouseup", this._handleMouseUp.bind(this)));
        }
        _handleMouseMove(e3) {
          this._lastMouseEvent = e3;
          const t3 = this._positionFromMouseEvent(e3, this._element, this._mouseService);
          if (!t3)
            return;
          this._isMouseOut = false;
          const i3 = e3.composedPath();
          for (let e4 = 0;e4 < i3.length; e4++) {
            const t4 = i3[e4];
            if (t4.classList.contains("xterm"))
              break;
            if (t4.classList.contains("xterm-hover"))
              return;
          }
          this._lastBufferCell && t3.x === this._lastBufferCell.x && t3.y === this._lastBufferCell.y || (this._handleHover(t3), this._lastBufferCell = t3);
        }
        _handleHover(e3) {
          if (this._activeLine !== e3.y || this._wasResized)
            return this._clearCurrentLink(), this._askForLink(e3, false), void (this._wasResized = false);
          this._currentLink && this._linkAtPosition(this._currentLink.link, e3) || (this._clearCurrentLink(), this._askForLink(e3, true));
        }
        _askForLink(e3, t3) {
          this._activeProviderReplies && t3 || (this._activeProviderReplies?.forEach((e4) => {
            e4?.forEach((e5) => {
              e5.link.dispose && e5.link.dispose();
            });
          }), this._activeProviderReplies = new Map, this._activeLine = e3.y);
          let i3 = false;
          for (const [s3, r2] of this._linkProviderService.linkProviders.entries())
            if (t3) {
              const t4 = this._activeProviderReplies?.get(s3);
              t4 && (i3 = this._checkLinkProviderResult(s3, e3, i3));
            } else
              r2.provideLinks(e3.y, (t4) => {
                if (this._isMouseOut)
                  return;
                const r3 = t4?.map((e4) => ({ link: e4 }));
                this._activeProviderReplies?.set(s3, r3), i3 = this._checkLinkProviderResult(s3, e3, i3), this._activeProviderReplies?.size === this._linkProviderService.linkProviders.length && this._removeIntersectingLinks(e3.y, this._activeProviderReplies);
              });
        }
        _removeIntersectingLinks(e3, t3) {
          const i3 = new Set;
          for (let s3 = 0;s3 < t3.size; s3++) {
            const r2 = t3.get(s3);
            if (r2)
              for (let t4 = 0;t4 < r2.length; t4++) {
                const s4 = r2[t4], n2 = s4.link.range.start.y < e3 ? 0 : s4.link.range.start.x, o2 = s4.link.range.end.y > e3 ? this._bufferService.cols : s4.link.range.end.x;
                for (let e4 = n2;e4 <= o2; e4++) {
                  if (i3.has(e4)) {
                    r2.splice(t4--, 1);
                    break;
                  }
                  i3.add(e4);
                }
              }
          }
        }
        _checkLinkProviderResult(e3, t3, i3) {
          if (!this._activeProviderReplies)
            return i3;
          const s3 = this._activeProviderReplies.get(e3);
          let r2 = false;
          for (let t4 = 0;t4 < e3; t4++)
            this._activeProviderReplies.has(t4) && !this._activeProviderReplies.get(t4) || (r2 = true);
          if (!r2 && s3) {
            const e4 = s3.find((e5) => this._linkAtPosition(e5.link, t3));
            e4 && (i3 = true, this._handleNewLink(e4));
          }
          if (this._activeProviderReplies.size === this._linkProviderService.linkProviders.length && !i3)
            for (let e4 = 0;e4 < this._activeProviderReplies.size; e4++) {
              const s4 = this._activeProviderReplies.get(e4)?.find((e5) => this._linkAtPosition(e5.link, t3));
              if (s4) {
                i3 = true, this._handleNewLink(s4);
                break;
              }
            }
          return i3;
        }
        _handleMouseDown() {
          this._mouseDownLink = this._currentLink;
        }
        _handleMouseUp(e3) {
          if (!this._currentLink)
            return;
          const t3 = this._positionFromMouseEvent(e3, this._element, this._mouseService);
          t3 && this._mouseDownLink === this._currentLink && this._linkAtPosition(this._currentLink.link, t3) && this._currentLink.link.activate(e3, this._currentLink.link.text);
        }
        _clearCurrentLink(e3, t3) {
          this._currentLink && this._lastMouseEvent && (!e3 || !t3 || this._currentLink.link.range.start.y >= e3 && this._currentLink.link.range.end.y <= t3) && (this._linkLeave(this._element, this._currentLink.link, this._lastMouseEvent), this._currentLink = undefined, (0, a.disposeArray)(this._linkCacheDisposables));
        }
        _handleNewLink(e3) {
          if (!this._lastMouseEvent)
            return;
          const t3 = this._positionFromMouseEvent(this._lastMouseEvent, this._element, this._mouseService);
          t3 && this._linkAtPosition(e3.link, t3) && (this._currentLink = e3, this._currentLink.state = { decorations: { underline: e3.link.decorations === undefined || e3.link.decorations.underline, pointerCursor: e3.link.decorations === undefined || e3.link.decorations.pointerCursor }, isHovered: true }, this._linkHover(this._element, e3.link, this._lastMouseEvent), e3.link.decorations = {}, Object.defineProperties(e3.link.decorations, { pointerCursor: { get: () => this._currentLink?.state?.decorations.pointerCursor, set: (e4) => {
            this._currentLink?.state && this._currentLink.state.decorations.pointerCursor !== e4 && (this._currentLink.state.decorations.pointerCursor = e4, this._currentLink.state.isHovered && this._element.classList.toggle("xterm-cursor-pointer", e4));
          } }, underline: { get: () => this._currentLink?.state?.decorations.underline, set: (t4) => {
            this._currentLink?.state && this._currentLink?.state?.decorations.underline !== t4 && (this._currentLink.state.decorations.underline = t4, this._currentLink.state.isHovered && this._fireUnderlineEvent(e3.link, t4));
          } } }), this._linkCacheDisposables.push(this._renderService.onRenderedViewportChange((e4) => {
            if (!this._currentLink)
              return;
            const t4 = e4.start === 0 ? 0 : e4.start + 1 + this._bufferService.buffer.ydisp, i3 = this._bufferService.buffer.ydisp + 1 + e4.end;
            if (this._currentLink.link.range.start.y >= t4 && this._currentLink.link.range.end.y <= i3 && (this._clearCurrentLink(t4, i3), this._lastMouseEvent)) {
              const e5 = this._positionFromMouseEvent(this._lastMouseEvent, this._element, this._mouseService);
              e5 && this._askForLink(e5, false);
            }
          })));
        }
        _linkHover(e3, t3, i3) {
          this._currentLink?.state && (this._currentLink.state.isHovered = true, this._currentLink.state.decorations.underline && this._fireUnderlineEvent(t3, true), this._currentLink.state.decorations.pointerCursor && e3.classList.add("xterm-cursor-pointer")), t3.hover && t3.hover(i3, t3.text);
        }
        _fireUnderlineEvent(e3, t3) {
          const i3 = e3.range, s3 = this._bufferService.buffer.ydisp, r2 = this._createLinkUnderlineEvent(i3.start.x - 1, i3.start.y - s3 - 1, i3.end.x, i3.end.y - s3 - 1, undefined);
          (t3 ? this._onShowLinkUnderline : this._onHideLinkUnderline).fire(r2);
        }
        _linkLeave(e3, t3, i3) {
          this._currentLink?.state && (this._currentLink.state.isHovered = false, this._currentLink.state.decorations.underline && this._fireUnderlineEvent(t3, false), this._currentLink.state.decorations.pointerCursor && e3.classList.remove("xterm-cursor-pointer")), t3.leave && t3.leave(i3, t3.text);
        }
        _linkAtPosition(e3, t3) {
          const i3 = e3.range.start.y * this._bufferService.cols + e3.range.start.x, s3 = e3.range.end.y * this._bufferService.cols + e3.range.end.x, r2 = t3.y * this._bufferService.cols + t3.x;
          return i3 <= r2 && r2 <= s3;
        }
        _positionFromMouseEvent(e3, t3, i3) {
          const s3 = i3.getCoords(e3, t3, this._bufferService.cols, this._bufferService.rows);
          if (s3)
            return { x: s3[0], y: s3[1] + this._bufferService.buffer.ydisp };
        }
        _createLinkUnderlineEvent(e3, t3, i3, s3, r2) {
          return { x1: e3, y1: t3, x2: i3, y2: s3, cols: this._bufferService.cols, fg: r2 };
        }
      };
      t2.Linkifier = l = s2([r(1, c.IMouseService), r(2, c.IRenderService), r(3, h.IBufferService), r(4, c.ILinkProviderService)], l);
    }, 9042: (e2, t2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.tooMuchOutput = t2.promptLabel = undefined, t2.promptLabel = "Terminal input", t2.tooMuchOutput = "Too much output to announce, navigate to rows manually to read";
    }, 3730: function(e2, t2, i2) {
      var s2 = this && this.__decorate || function(e3, t3, i3, s3) {
        var r2, n2 = arguments.length, o2 = n2 < 3 ? t3 : s3 === null ? s3 = Object.getOwnPropertyDescriptor(t3, i3) : s3;
        if (typeof Reflect == "object" && typeof Reflect.decorate == "function")
          o2 = Reflect.decorate(e3, t3, i3, s3);
        else
          for (var a2 = e3.length - 1;a2 >= 0; a2--)
            (r2 = e3[a2]) && (o2 = (n2 < 3 ? r2(o2) : n2 > 3 ? r2(t3, i3, o2) : r2(t3, i3)) || o2);
        return n2 > 3 && o2 && Object.defineProperty(t3, i3, o2), o2;
      }, r = this && this.__param || function(e3, t3) {
        return function(i3, s3) {
          t3(i3, s3, e3);
        };
      };
      Object.defineProperty(t2, "__esModule", { value: true }), t2.OscLinkProvider = undefined;
      const n = i2(511), o = i2(2585);
      let a = t2.OscLinkProvider = class {
        constructor(e3, t3, i3) {
          this._bufferService = e3, this._optionsService = t3, this._oscLinkService = i3;
        }
        provideLinks(e3, t3) {
          const i3 = this._bufferService.buffer.lines.get(e3 - 1);
          if (!i3)
            return void t3(undefined);
          const s3 = [], r2 = this._optionsService.rawOptions.linkHandler, o2 = new n.CellData, a2 = i3.getTrimmedLength();
          let c = -1, l = -1, d = false;
          for (let t4 = 0;t4 < a2; t4++)
            if (l !== -1 || i3.hasContent(t4)) {
              if (i3.loadCell(t4, o2), o2.hasExtendedAttrs() && o2.extended.urlId) {
                if (l === -1) {
                  l = t4, c = o2.extended.urlId;
                  continue;
                }
                d = o2.extended.urlId !== c;
              } else
                l !== -1 && (d = true);
              if (d || l !== -1 && t4 === a2 - 1) {
                const i4 = this._oscLinkService.getLinkData(c)?.uri;
                if (i4) {
                  const n2 = { start: { x: l + 1, y: e3 }, end: { x: t4 + (d || t4 !== a2 - 1 ? 0 : 1), y: e3 } };
                  let o3 = false;
                  if (!r2?.allowNonHttpProtocols)
                    try {
                      const e4 = new URL(i4);
                      ["http:", "https:"].includes(e4.protocol) || (o3 = true);
                    } catch (e4) {
                      o3 = true;
                    }
                  o3 || s3.push({ text: i4, range: n2, activate: (e4, t5) => r2 ? r2.activate(e4, t5, n2) : h(0, t5), hover: (e4, t5) => r2?.hover?.(e4, t5, n2), leave: (e4, t5) => r2?.leave?.(e4, t5, n2) });
                }
                d = false, o2.hasExtendedAttrs() && o2.extended.urlId ? (l = t4, c = o2.extended.urlId) : (l = -1, c = -1);
              }
            }
          t3(s3);
        }
      };
      function h(e3, t3) {
        if (confirm(`Do you want to navigate to ${t3}?

WARNING: This link could potentially be dangerous`)) {
          const e4 = window.open();
          if (e4) {
            try {
              e4.opener = null;
            } catch {}
            e4.location.href = t3;
          } else
            console.warn("Opening link blocked as opener could not be cleared");
        }
      }
      t2.OscLinkProvider = a = s2([r(0, o.IBufferService), r(1, o.IOptionsService), r(2, o.IOscLinkService)], a);
    }, 6193: (e2, t2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.RenderDebouncer = undefined, t2.RenderDebouncer = class {
        constructor(e3, t3) {
          this._renderCallback = e3, this._coreBrowserService = t3, this._refreshCallbacks = [];
        }
        dispose() {
          this._animationFrame && (this._coreBrowserService.window.cancelAnimationFrame(this._animationFrame), this._animationFrame = undefined);
        }
        addRefreshCallback(e3) {
          return this._refreshCallbacks.push(e3), this._animationFrame || (this._animationFrame = this._coreBrowserService.window.requestAnimationFrame(() => this._innerRefresh())), this._animationFrame;
        }
        refresh(e3, t3, i2) {
          this._rowCount = i2, e3 = e3 !== undefined ? e3 : 0, t3 = t3 !== undefined ? t3 : this._rowCount - 1, this._rowStart = this._rowStart !== undefined ? Math.min(this._rowStart, e3) : e3, this._rowEnd = this._rowEnd !== undefined ? Math.max(this._rowEnd, t3) : t3, this._animationFrame || (this._animationFrame = this._coreBrowserService.window.requestAnimationFrame(() => this._innerRefresh()));
        }
        _innerRefresh() {
          if (this._animationFrame = undefined, this._rowStart === undefined || this._rowEnd === undefined || this._rowCount === undefined)
            return void this._runRefreshCallbacks();
          const e3 = Math.max(this._rowStart, 0), t3 = Math.min(this._rowEnd, this._rowCount - 1);
          this._rowStart = undefined, this._rowEnd = undefined, this._renderCallback(e3, t3), this._runRefreshCallbacks();
        }
        _runRefreshCallbacks() {
          for (const e3 of this._refreshCallbacks)
            e3(0);
          this._refreshCallbacks = [];
        }
      };
    }, 3236: (e2, t2, i2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.Terminal = undefined;
      const s2 = i2(3614), r = i2(3656), n = i2(3551), o = i2(9042), a = i2(3730), h = i2(1680), c = i2(3107), l = i2(5744), d = i2(2950), _ = i2(1296), u = i2(428), f = i2(4269), v = i2(5114), p = i2(8934), g = i2(3230), m = i2(9312), S = i2(4725), C = i2(6731), b = i2(8055), w = i2(8969), y = i2(8460), E = i2(844), k = i2(6114), L = i2(8437), D = i2(2584), R = i2(7399), x = i2(5941), A = i2(9074), B = i2(2585), T = i2(5435), M = i2(4567), O = i2(779);

      class P extends w.CoreTerminal {
        get onFocus() {
          return this._onFocus.event;
        }
        get onBlur() {
          return this._onBlur.event;
        }
        get onA11yChar() {
          return this._onA11yCharEmitter.event;
        }
        get onA11yTab() {
          return this._onA11yTabEmitter.event;
        }
        get onWillOpen() {
          return this._onWillOpen.event;
        }
        constructor(e3 = {}) {
          super(e3), this.browser = k, this._keyDownHandled = false, this._keyDownSeen = false, this._keyPressHandled = false, this._unprocessedDeadKey = false, this._accessibilityManager = this.register(new E.MutableDisposable), this._onCursorMove = this.register(new y.EventEmitter), this.onCursorMove = this._onCursorMove.event, this._onKey = this.register(new y.EventEmitter), this.onKey = this._onKey.event, this._onRender = this.register(new y.EventEmitter), this.onRender = this._onRender.event, this._onSelectionChange = this.register(new y.EventEmitter), this.onSelectionChange = this._onSelectionChange.event, this._onTitleChange = this.register(new y.EventEmitter), this.onTitleChange = this._onTitleChange.event, this._onBell = this.register(new y.EventEmitter), this.onBell = this._onBell.event, this._onFocus = this.register(new y.EventEmitter), this._onBlur = this.register(new y.EventEmitter), this._onA11yCharEmitter = this.register(new y.EventEmitter), this._onA11yTabEmitter = this.register(new y.EventEmitter), this._onWillOpen = this.register(new y.EventEmitter), this._setup(), this._decorationService = this._instantiationService.createInstance(A.DecorationService), this._instantiationService.setService(B.IDecorationService, this._decorationService), this._linkProviderService = this._instantiationService.createInstance(O.LinkProviderService), this._instantiationService.setService(S.ILinkProviderService, this._linkProviderService), this._linkProviderService.registerLinkProvider(this._instantiationService.createInstance(a.OscLinkProvider)), this.register(this._inputHandler.onRequestBell(() => this._onBell.fire())), this.register(this._inputHandler.onRequestRefreshRows((e4, t3) => this.refresh(e4, t3))), this.register(this._inputHandler.onRequestSendFocus(() => this._reportFocus())), this.register(this._inputHandler.onRequestReset(() => this.reset())), this.register(this._inputHandler.onRequestWindowsOptionsReport((e4) => this._reportWindowsOptions(e4))), this.register(this._inputHandler.onColor((e4) => this._handleColorEvent(e4))), this.register((0, y.forwardEvent)(this._inputHandler.onCursorMove, this._onCursorMove)), this.register((0, y.forwardEvent)(this._inputHandler.onTitleChange, this._onTitleChange)), this.register((0, y.forwardEvent)(this._inputHandler.onA11yChar, this._onA11yCharEmitter)), this.register((0, y.forwardEvent)(this._inputHandler.onA11yTab, this._onA11yTabEmitter)), this.register(this._bufferService.onResize((e4) => this._afterResize(e4.cols, e4.rows))), this.register((0, E.toDisposable)(() => {
            this._customKeyEventHandler = undefined, this.element?.parentNode?.removeChild(this.element);
          }));
        }
        _handleColorEvent(e3) {
          if (this._themeService)
            for (const t3 of e3) {
              let e4, i3 = "";
              switch (t3.index) {
                case 256:
                  e4 = "foreground", i3 = "10";
                  break;
                case 257:
                  e4 = "background", i3 = "11";
                  break;
                case 258:
                  e4 = "cursor", i3 = "12";
                  break;
                default:
                  e4 = "ansi", i3 = "4;" + t3.index;
              }
              switch (t3.type) {
                case 0:
                  const s3 = b.color.toColorRGB(e4 === "ansi" ? this._themeService.colors.ansi[t3.index] : this._themeService.colors[e4]);
                  this.coreService.triggerDataEvent(`${D.C0.ESC}]${i3};${(0, x.toRgbString)(s3)}${D.C1_ESCAPED.ST}`);
                  break;
                case 1:
                  if (e4 === "ansi")
                    this._themeService.modifyColors((e5) => e5.ansi[t3.index] = b.channels.toColor(...t3.color));
                  else {
                    const i4 = e4;
                    this._themeService.modifyColors((e5) => e5[i4] = b.channels.toColor(...t3.color));
                  }
                  break;
                case 2:
                  this._themeService.restoreColor(t3.index);
              }
            }
        }
        _setup() {
          super._setup(), this._customKeyEventHandler = undefined;
        }
        get buffer() {
          return this.buffers.active;
        }
        focus() {
          this.textarea && this.textarea.focus({ preventScroll: true });
        }
        _handleScreenReaderModeOptionChange(e3) {
          e3 ? !this._accessibilityManager.value && this._renderService && (this._accessibilityManager.value = this._instantiationService.createInstance(M.AccessibilityManager, this)) : this._accessibilityManager.clear();
        }
        _handleTextAreaFocus(e3) {
          this.coreService.decPrivateModes.sendFocus && this.coreService.triggerDataEvent(D.C0.ESC + "[I"), this.element.classList.add("focus"), this._showCursor(), this._onFocus.fire();
        }
        blur() {
          return this.textarea?.blur();
        }
        _handleTextAreaBlur() {
          this.textarea.value = "", this.refresh(this.buffer.y, this.buffer.y), this.coreService.decPrivateModes.sendFocus && this.coreService.triggerDataEvent(D.C0.ESC + "[O"), this.element.classList.remove("focus"), this._onBlur.fire();
        }
        _syncTextArea() {
          if (!this.textarea || !this.buffer.isCursorInViewport || this._compositionHelper.isComposing || !this._renderService)
            return;
          const e3 = this.buffer.ybase + this.buffer.y, t3 = this.buffer.lines.get(e3);
          if (!t3)
            return;
          const i3 = Math.min(this.buffer.x, this.cols - 1), s3 = this._renderService.dimensions.css.cell.height, r2 = t3.getWidth(i3), n2 = this._renderService.dimensions.css.cell.width * r2, o2 = this.buffer.y * this._renderService.dimensions.css.cell.height, a2 = i3 * this._renderService.dimensions.css.cell.width;
          this.textarea.style.left = a2 + "px", this.textarea.style.top = o2 + "px", this.textarea.style.width = n2 + "px", this.textarea.style.height = s3 + "px", this.textarea.style.lineHeight = s3 + "px", this.textarea.style.zIndex = "-5";
        }
        _initGlobal() {
          this._bindKeys(), this.register((0, r.addDisposableDomListener)(this.element, "copy", (e4) => {
            this.hasSelection() && (0, s2.copyHandler)(e4, this._selectionService);
          }));
          const e3 = (e4) => (0, s2.handlePasteEvent)(e4, this.textarea, this.coreService, this.optionsService);
          this.register((0, r.addDisposableDomListener)(this.textarea, "paste", e3)), this.register((0, r.addDisposableDomListener)(this.element, "paste", e3)), k.isFirefox ? this.register((0, r.addDisposableDomListener)(this.element, "mousedown", (e4) => {
            e4.button === 2 && (0, s2.rightClickHandler)(e4, this.textarea, this.screenElement, this._selectionService, this.options.rightClickSelectsWord);
          })) : this.register((0, r.addDisposableDomListener)(this.element, "contextmenu", (e4) => {
            (0, s2.rightClickHandler)(e4, this.textarea, this.screenElement, this._selectionService, this.options.rightClickSelectsWord);
          })), k.isLinux && this.register((0, r.addDisposableDomListener)(this.element, "auxclick", (e4) => {
            e4.button === 1 && (0, s2.moveTextAreaUnderMouseCursor)(e4, this.textarea, this.screenElement);
          }));
        }
        _bindKeys() {
          this.register((0, r.addDisposableDomListener)(this.textarea, "keyup", (e3) => this._keyUp(e3), true)), this.register((0, r.addDisposableDomListener)(this.textarea, "keydown", (e3) => this._keyDown(e3), true)), this.register((0, r.addDisposableDomListener)(this.textarea, "keypress", (e3) => this._keyPress(e3), true)), this.register((0, r.addDisposableDomListener)(this.textarea, "compositionstart", () => this._compositionHelper.compositionstart())), this.register((0, r.addDisposableDomListener)(this.textarea, "compositionupdate", (e3) => this._compositionHelper.compositionupdate(e3))), this.register((0, r.addDisposableDomListener)(this.textarea, "compositionend", () => this._compositionHelper.compositionend())), this.register((0, r.addDisposableDomListener)(this.textarea, "input", (e3) => this._inputEvent(e3), true)), this.register(this.onRender(() => this._compositionHelper.updateCompositionElements()));
        }
        open(e3) {
          if (!e3)
            throw new Error("Terminal requires a parent element.");
          if (e3.isConnected || this._logService.debug("Terminal.open was called on an element that was not attached to the DOM"), this.element?.ownerDocument.defaultView && this._coreBrowserService)
            return void (this.element.ownerDocument.defaultView !== this._coreBrowserService.window && (this._coreBrowserService.window = this.element.ownerDocument.defaultView));
          this._document = e3.ownerDocument, this.options.documentOverride && this.options.documentOverride instanceof Document && (this._document = this.optionsService.rawOptions.documentOverride), this.element = this._document.createElement("div"), this.element.dir = "ltr", this.element.classList.add("terminal"), this.element.classList.add("xterm"), e3.appendChild(this.element);
          const t3 = this._document.createDocumentFragment();
          this._viewportElement = this._document.createElement("div"), this._viewportElement.classList.add("xterm-viewport"), t3.appendChild(this._viewportElement), this._viewportScrollArea = this._document.createElement("div"), this._viewportScrollArea.classList.add("xterm-scroll-area"), this._viewportElement.appendChild(this._viewportScrollArea), this.screenElement = this._document.createElement("div"), this.screenElement.classList.add("xterm-screen"), this.register((0, r.addDisposableDomListener)(this.screenElement, "mousemove", (e4) => this.updateCursorStyle(e4))), this._helperContainer = this._document.createElement("div"), this._helperContainer.classList.add("xterm-helpers"), this.screenElement.appendChild(this._helperContainer), t3.appendChild(this.screenElement), this.textarea = this._document.createElement("textarea"), this.textarea.classList.add("xterm-helper-textarea"), this.textarea.setAttribute("aria-label", o.promptLabel), k.isChromeOS || this.textarea.setAttribute("aria-multiline", "false"), this.textarea.setAttribute("autocorrect", "off"), this.textarea.setAttribute("autocapitalize", "off"), this.textarea.setAttribute("spellcheck", "false"), this.textarea.tabIndex = 0, this._coreBrowserService = this.register(this._instantiationService.createInstance(v.CoreBrowserService, this.textarea, e3.ownerDocument.defaultView ?? window, this._document ?? typeof window != "undefined" ? window.document : null)), this._instantiationService.setService(S.ICoreBrowserService, this._coreBrowserService), this.register((0, r.addDisposableDomListener)(this.textarea, "focus", (e4) => this._handleTextAreaFocus(e4))), this.register((0, r.addDisposableDomListener)(this.textarea, "blur", () => this._handleTextAreaBlur())), this._helperContainer.appendChild(this.textarea), this._charSizeService = this._instantiationService.createInstance(u.CharSizeService, this._document, this._helperContainer), this._instantiationService.setService(S.ICharSizeService, this._charSizeService), this._themeService = this._instantiationService.createInstance(C.ThemeService), this._instantiationService.setService(S.IThemeService, this._themeService), this._characterJoinerService = this._instantiationService.createInstance(f.CharacterJoinerService), this._instantiationService.setService(S.ICharacterJoinerService, this._characterJoinerService), this._renderService = this.register(this._instantiationService.createInstance(g.RenderService, this.rows, this.screenElement)), this._instantiationService.setService(S.IRenderService, this._renderService), this.register(this._renderService.onRenderedViewportChange((e4) => this._onRender.fire(e4))), this.onResize((e4) => this._renderService.resize(e4.cols, e4.rows)), this._compositionView = this._document.createElement("div"), this._compositionView.classList.add("composition-view"), this._compositionHelper = this._instantiationService.createInstance(d.CompositionHelper, this.textarea, this._compositionView), this._helperContainer.appendChild(this._compositionView), this._mouseService = this._instantiationService.createInstance(p.MouseService), this._instantiationService.setService(S.IMouseService, this._mouseService), this.linkifier = this.register(this._instantiationService.createInstance(n.Linkifier, this.screenElement)), this.element.appendChild(t3);
          try {
            this._onWillOpen.fire(this.element);
          } catch {}
          this._renderService.hasRenderer() || this._renderService.setRenderer(this._createRenderer()), this.viewport = this._instantiationService.createInstance(h.Viewport, this._viewportElement, this._viewportScrollArea), this.viewport.onRequestScrollLines((e4) => this.scrollLines(e4.amount, e4.suppressScrollEvent, 1)), this.register(this._inputHandler.onRequestSyncScrollBar(() => this.viewport.syncScrollArea())), this.register(this.viewport), this.register(this.onCursorMove(() => {
            this._renderService.handleCursorMove(), this._syncTextArea();
          })), this.register(this.onResize(() => this._renderService.handleResize(this.cols, this.rows))), this.register(this.onBlur(() => this._renderService.handleBlur())), this.register(this.onFocus(() => this._renderService.handleFocus())), this.register(this._renderService.onDimensionsChange(() => this.viewport.syncScrollArea())), this._selectionService = this.register(this._instantiationService.createInstance(m.SelectionService, this.element, this.screenElement, this.linkifier)), this._instantiationService.setService(S.ISelectionService, this._selectionService), this.register(this._selectionService.onRequestScrollLines((e4) => this.scrollLines(e4.amount, e4.suppressScrollEvent))), this.register(this._selectionService.onSelectionChange(() => this._onSelectionChange.fire())), this.register(this._selectionService.onRequestRedraw((e4) => this._renderService.handleSelectionChanged(e4.start, e4.end, e4.columnSelectMode))), this.register(this._selectionService.onLinuxMouseSelection((e4) => {
            this.textarea.value = e4, this.textarea.focus(), this.textarea.select();
          })), this.register(this._onScroll.event((e4) => {
            this.viewport.syncScrollArea(), this._selectionService.refresh();
          })), this.register((0, r.addDisposableDomListener)(this._viewportElement, "scroll", () => this._selectionService.refresh())), this.register(this._instantiationService.createInstance(c.BufferDecorationRenderer, this.screenElement)), this.register((0, r.addDisposableDomListener)(this.element, "mousedown", (e4) => this._selectionService.handleMouseDown(e4))), this.coreMouseService.areMouseEventsActive ? (this._selectionService.disable(), this.element.classList.add("enable-mouse-events")) : this._selectionService.enable(), this.options.screenReaderMode && (this._accessibilityManager.value = this._instantiationService.createInstance(M.AccessibilityManager, this)), this.register(this.optionsService.onSpecificOptionChange("screenReaderMode", (e4) => this._handleScreenReaderModeOptionChange(e4))), this.options.overviewRulerWidth && (this._overviewRulerRenderer = this.register(this._instantiationService.createInstance(l.OverviewRulerRenderer, this._viewportElement, this.screenElement))), this.optionsService.onSpecificOptionChange("overviewRulerWidth", (e4) => {
            !this._overviewRulerRenderer && e4 && this._viewportElement && this.screenElement && (this._overviewRulerRenderer = this.register(this._instantiationService.createInstance(l.OverviewRulerRenderer, this._viewportElement, this.screenElement)));
          }), this._charSizeService.measure(), this.refresh(0, this.rows - 1), this._initGlobal(), this.bindMouse();
        }
        _createRenderer() {
          return this._instantiationService.createInstance(_.DomRenderer, this, this._document, this.element, this.screenElement, this._viewportElement, this._helperContainer, this.linkifier);
        }
        bindMouse() {
          const e3 = this, t3 = this.element;
          function i3(t4) {
            const i4 = e3._mouseService.getMouseReportCoords(t4, e3.screenElement);
            if (!i4)
              return false;
            let s4, r2;
            switch (t4.overrideType || t4.type) {
              case "mousemove":
                r2 = 32, t4.buttons === undefined ? (s4 = 3, t4.button !== undefined && (s4 = t4.button < 3 ? t4.button : 3)) : s4 = 1 & t4.buttons ? 0 : 4 & t4.buttons ? 1 : 2 & t4.buttons ? 2 : 3;
                break;
              case "mouseup":
                r2 = 0, s4 = t4.button < 3 ? t4.button : 3;
                break;
              case "mousedown":
                r2 = 1, s4 = t4.button < 3 ? t4.button : 3;
                break;
              case "wheel":
                if (e3._customWheelEventHandler && e3._customWheelEventHandler(t4) === false)
                  return false;
                if (e3.viewport.getLinesScrolled(t4) === 0)
                  return false;
                r2 = t4.deltaY < 0 ? 0 : 1, s4 = 4;
                break;
              default:
                return false;
            }
            return !(r2 === undefined || s4 === undefined || s4 > 4) && e3.coreMouseService.triggerMouseEvent({ col: i4.col, row: i4.row, x: i4.x, y: i4.y, button: s4, action: r2, ctrl: t4.ctrlKey, alt: t4.altKey, shift: t4.shiftKey });
          }
          const s3 = { mouseup: null, wheel: null, mousedrag: null, mousemove: null }, n2 = { mouseup: (e4) => (i3(e4), e4.buttons || (this._document.removeEventListener("mouseup", s3.mouseup), s3.mousedrag && this._document.removeEventListener("mousemove", s3.mousedrag)), this.cancel(e4)), wheel: (e4) => (i3(e4), this.cancel(e4, true)), mousedrag: (e4) => {
            e4.buttons && i3(e4);
          }, mousemove: (e4) => {
            e4.buttons || i3(e4);
          } };
          this.register(this.coreMouseService.onProtocolChange((e4) => {
            e4 ? (this.optionsService.rawOptions.logLevel === "debug" && this._logService.debug("Binding to mouse events:", this.coreMouseService.explainEvents(e4)), this.element.classList.add("enable-mouse-events"), this._selectionService.disable()) : (this._logService.debug("Unbinding from mouse events."), this.element.classList.remove("enable-mouse-events"), this._selectionService.enable()), 8 & e4 ? s3.mousemove || (t3.addEventListener("mousemove", n2.mousemove), s3.mousemove = n2.mousemove) : (t3.removeEventListener("mousemove", s3.mousemove), s3.mousemove = null), 16 & e4 ? s3.wheel || (t3.addEventListener("wheel", n2.wheel, { passive: false }), s3.wheel = n2.wheel) : (t3.removeEventListener("wheel", s3.wheel), s3.wheel = null), 2 & e4 ? s3.mouseup || (s3.mouseup = n2.mouseup) : (this._document.removeEventListener("mouseup", s3.mouseup), s3.mouseup = null), 4 & e4 ? s3.mousedrag || (s3.mousedrag = n2.mousedrag) : (this._document.removeEventListener("mousemove", s3.mousedrag), s3.mousedrag = null);
          })), this.coreMouseService.activeProtocol = this.coreMouseService.activeProtocol, this.register((0, r.addDisposableDomListener)(t3, "mousedown", (e4) => {
            if (e4.preventDefault(), this.focus(), this.coreMouseService.areMouseEventsActive && !this._selectionService.shouldForceSelection(e4))
              return i3(e4), s3.mouseup && this._document.addEventListener("mouseup", s3.mouseup), s3.mousedrag && this._document.addEventListener("mousemove", s3.mousedrag), this.cancel(e4);
          })), this.register((0, r.addDisposableDomListener)(t3, "wheel", (e4) => {
            if (!s3.wheel) {
              if (this._customWheelEventHandler && this._customWheelEventHandler(e4) === false)
                return false;
              if (!this.buffer.hasScrollback) {
                const t4 = this.viewport.getLinesScrolled(e4);
                if (t4 === 0)
                  return;
                const i4 = D.C0.ESC + (this.coreService.decPrivateModes.applicationCursorKeys ? "O" : "[") + (e4.deltaY < 0 ? "A" : "B");
                let s4 = "";
                for (let e5 = 0;e5 < Math.abs(t4); e5++)
                  s4 += i4;
                return this.coreService.triggerDataEvent(s4, true), this.cancel(e4, true);
              }
              return this.viewport.handleWheel(e4) ? this.cancel(e4) : undefined;
            }
          }, { passive: false })), this.register((0, r.addDisposableDomListener)(t3, "touchstart", (e4) => {
            if (!this.coreMouseService.areMouseEventsActive)
              return this.viewport.handleTouchStart(e4), this.cancel(e4);
          }, { passive: true })), this.register((0, r.addDisposableDomListener)(t3, "touchmove", (e4) => {
            if (!this.coreMouseService.areMouseEventsActive)
              return this.viewport.handleTouchMove(e4) ? undefined : this.cancel(e4);
          }, { passive: false }));
        }
        refresh(e3, t3) {
          this._renderService?.refreshRows(e3, t3);
        }
        updateCursorStyle(e3) {
          this._selectionService?.shouldColumnSelect(e3) ? this.element.classList.add("column-select") : this.element.classList.remove("column-select");
        }
        _showCursor() {
          this.coreService.isCursorInitialized || (this.coreService.isCursorInitialized = true, this.refresh(this.buffer.y, this.buffer.y));
        }
        scrollLines(e3, t3, i3 = 0) {
          i3 === 1 ? (super.scrollLines(e3, t3, i3), this.refresh(0, this.rows - 1)) : this.viewport?.scrollLines(e3);
        }
        paste(e3) {
          (0, s2.paste)(e3, this.textarea, this.coreService, this.optionsService);
        }
        attachCustomKeyEventHandler(e3) {
          this._customKeyEventHandler = e3;
        }
        attachCustomWheelEventHandler(e3) {
          this._customWheelEventHandler = e3;
        }
        registerLinkProvider(e3) {
          return this._linkProviderService.registerLinkProvider(e3);
        }
        registerCharacterJoiner(e3) {
          if (!this._characterJoinerService)
            throw new Error("Terminal must be opened first");
          const t3 = this._characterJoinerService.register(e3);
          return this.refresh(0, this.rows - 1), t3;
        }
        deregisterCharacterJoiner(e3) {
          if (!this._characterJoinerService)
            throw new Error("Terminal must be opened first");
          this._characterJoinerService.deregister(e3) && this.refresh(0, this.rows - 1);
        }
        get markers() {
          return this.buffer.markers;
        }
        registerMarker(e3) {
          return this.buffer.addMarker(this.buffer.ybase + this.buffer.y + e3);
        }
        registerDecoration(e3) {
          return this._decorationService.registerDecoration(e3);
        }
        hasSelection() {
          return !!this._selectionService && this._selectionService.hasSelection;
        }
        select(e3, t3, i3) {
          this._selectionService.setSelection(e3, t3, i3);
        }
        getSelection() {
          return this._selectionService ? this._selectionService.selectionText : "";
        }
        getSelectionPosition() {
          if (this._selectionService && this._selectionService.hasSelection)
            return { start: { x: this._selectionService.selectionStart[0], y: this._selectionService.selectionStart[1] }, end: { x: this._selectionService.selectionEnd[0], y: this._selectionService.selectionEnd[1] } };
        }
        clearSelection() {
          this._selectionService?.clearSelection();
        }
        selectAll() {
          this._selectionService?.selectAll();
        }
        selectLines(e3, t3) {
          this._selectionService?.selectLines(e3, t3);
        }
        _keyDown(e3) {
          if (this._keyDownHandled = false, this._keyDownSeen = true, this._customKeyEventHandler && this._customKeyEventHandler(e3) === false)
            return false;
          const t3 = this.browser.isMac && this.options.macOptionIsMeta && e3.altKey;
          if (!t3 && !this._compositionHelper.keydown(e3))
            return this.options.scrollOnUserInput && this.buffer.ybase !== this.buffer.ydisp && this.scrollToBottom(), false;
          t3 || e3.key !== "Dead" && e3.key !== "AltGraph" || (this._unprocessedDeadKey = true);
          const i3 = (0, R.evaluateKeyboardEvent)(e3, this.coreService.decPrivateModes.applicationCursorKeys, this.browser.isMac, this.options.macOptionIsMeta);
          if (this.updateCursorStyle(e3), i3.type === 3 || i3.type === 2) {
            const t4 = this.rows - 1;
            return this.scrollLines(i3.type === 2 ? -t4 : t4), this.cancel(e3, true);
          }
          return i3.type === 1 && this.selectAll(), !!this._isThirdLevelShift(this.browser, e3) || (i3.cancel && this.cancel(e3, true), !i3.key || !!(e3.key && !e3.ctrlKey && !e3.altKey && !e3.metaKey && e3.key.length === 1 && e3.key.charCodeAt(0) >= 65 && e3.key.charCodeAt(0) <= 90) || (this._unprocessedDeadKey ? (this._unprocessedDeadKey = false, true) : (i3.key !== D.C0.ETX && i3.key !== D.C0.CR || (this.textarea.value = ""), this._onKey.fire({ key: i3.key, domEvent: e3 }), this._showCursor(), this.coreService.triggerDataEvent(i3.key, true), !this.optionsService.rawOptions.screenReaderMode || e3.altKey || e3.ctrlKey ? this.cancel(e3, true) : void (this._keyDownHandled = true))));
        }
        _isThirdLevelShift(e3, t3) {
          const i3 = e3.isMac && !this.options.macOptionIsMeta && t3.altKey && !t3.ctrlKey && !t3.metaKey || e3.isWindows && t3.altKey && t3.ctrlKey && !t3.metaKey || e3.isWindows && t3.getModifierState("AltGraph");
          return t3.type === "keypress" ? i3 : i3 && (!t3.keyCode || t3.keyCode > 47);
        }
        _keyUp(e3) {
          this._keyDownSeen = false, this._customKeyEventHandler && this._customKeyEventHandler(e3) === false || (function(e4) {
            return e4.keyCode === 16 || e4.keyCode === 17 || e4.keyCode === 18;
          }(e3) || this.focus(), this.updateCursorStyle(e3), this._keyPressHandled = false);
        }
        _keyPress(e3) {
          let t3;
          if (this._keyPressHandled = false, this._keyDownHandled)
            return false;
          if (this._customKeyEventHandler && this._customKeyEventHandler(e3) === false)
            return false;
          if (this.cancel(e3), e3.charCode)
            t3 = e3.charCode;
          else if (e3.which === null || e3.which === undefined)
            t3 = e3.keyCode;
          else {
            if (e3.which === 0 || e3.charCode === 0)
              return false;
            t3 = e3.which;
          }
          return !(!t3 || (e3.altKey || e3.ctrlKey || e3.metaKey) && !this._isThirdLevelShift(this.browser, e3) || (t3 = String.fromCharCode(t3), this._onKey.fire({ key: t3, domEvent: e3 }), this._showCursor(), this.coreService.triggerDataEvent(t3, true), this._keyPressHandled = true, this._unprocessedDeadKey = false, 0));
        }
        _inputEvent(e3) {
          if (e3.data && e3.inputType === "insertText" && (!e3.composed || !this._keyDownSeen) && !this.optionsService.rawOptions.screenReaderMode) {
            if (this._keyPressHandled)
              return false;
            this._unprocessedDeadKey = false;
            const t3 = e3.data;
            return this.coreService.triggerDataEvent(t3, true), this.cancel(e3), true;
          }
          return false;
        }
        resize(e3, t3) {
          e3 !== this.cols || t3 !== this.rows ? super.resize(e3, t3) : this._charSizeService && !this._charSizeService.hasValidSize && this._charSizeService.measure();
        }
        _afterResize(e3, t3) {
          this._charSizeService?.measure(), this.viewport?.syncScrollArea(true);
        }
        clear() {
          if (this.buffer.ybase !== 0 || this.buffer.y !== 0) {
            this.buffer.clearAllMarkers(), this.buffer.lines.set(0, this.buffer.lines.get(this.buffer.ybase + this.buffer.y)), this.buffer.lines.length = 1, this.buffer.ydisp = 0, this.buffer.ybase = 0, this.buffer.y = 0;
            for (let e3 = 1;e3 < this.rows; e3++)
              this.buffer.lines.push(this.buffer.getBlankLine(L.DEFAULT_ATTR_DATA));
            this._onScroll.fire({ position: this.buffer.ydisp, source: 0 }), this.viewport?.reset(), this.refresh(0, this.rows - 1);
          }
        }
        reset() {
          this.options.rows = this.rows, this.options.cols = this.cols;
          const e3 = this._customKeyEventHandler;
          this._setup(), super.reset(), this._selectionService?.reset(), this._decorationService.reset(), this.viewport?.reset(), this._customKeyEventHandler = e3, this.refresh(0, this.rows - 1);
        }
        clearTextureAtlas() {
          this._renderService?.clearTextureAtlas();
        }
        _reportFocus() {
          this.element?.classList.contains("focus") ? this.coreService.triggerDataEvent(D.C0.ESC + "[I") : this.coreService.triggerDataEvent(D.C0.ESC + "[O");
        }
        _reportWindowsOptions(e3) {
          if (this._renderService)
            switch (e3) {
              case T.WindowsOptionsReportType.GET_WIN_SIZE_PIXELS:
                const e4 = this._renderService.dimensions.css.canvas.width.toFixed(0), t3 = this._renderService.dimensions.css.canvas.height.toFixed(0);
                this.coreService.triggerDataEvent(`${D.C0.ESC}[4;${t3};${e4}t`);
                break;
              case T.WindowsOptionsReportType.GET_CELL_SIZE_PIXELS:
                const i3 = this._renderService.dimensions.css.cell.width.toFixed(0), s3 = this._renderService.dimensions.css.cell.height.toFixed(0);
                this.coreService.triggerDataEvent(`${D.C0.ESC}[6;${s3};${i3}t`);
            }
        }
        cancel(e3, t3) {
          if (this.options.cancelEvents || t3)
            return e3.preventDefault(), e3.stopPropagation(), false;
        }
      }
      t2.Terminal = P;
    }, 9924: (e2, t2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.TimeBasedDebouncer = undefined, t2.TimeBasedDebouncer = class {
        constructor(e3, t3 = 1000) {
          this._renderCallback = e3, this._debounceThresholdMS = t3, this._lastRefreshMs = 0, this._additionalRefreshRequested = false;
        }
        dispose() {
          this._refreshTimeoutID && clearTimeout(this._refreshTimeoutID);
        }
        refresh(e3, t3, i2) {
          this._rowCount = i2, e3 = e3 !== undefined ? e3 : 0, t3 = t3 !== undefined ? t3 : this._rowCount - 1, this._rowStart = this._rowStart !== undefined ? Math.min(this._rowStart, e3) : e3, this._rowEnd = this._rowEnd !== undefined ? Math.max(this._rowEnd, t3) : t3;
          const s2 = Date.now();
          if (s2 - this._lastRefreshMs >= this._debounceThresholdMS)
            this._lastRefreshMs = s2, this._innerRefresh();
          else if (!this._additionalRefreshRequested) {
            const e4 = s2 - this._lastRefreshMs, t4 = this._debounceThresholdMS - e4;
            this._additionalRefreshRequested = true, this._refreshTimeoutID = window.setTimeout(() => {
              this._lastRefreshMs = Date.now(), this._innerRefresh(), this._additionalRefreshRequested = false, this._refreshTimeoutID = undefined;
            }, t4);
          }
        }
        _innerRefresh() {
          if (this._rowStart === undefined || this._rowEnd === undefined || this._rowCount === undefined)
            return;
          const e3 = Math.max(this._rowStart, 0), t3 = Math.min(this._rowEnd, this._rowCount - 1);
          this._rowStart = undefined, this._rowEnd = undefined, this._renderCallback(e3, t3);
        }
      };
    }, 1680: function(e2, t2, i2) {
      var s2 = this && this.__decorate || function(e3, t3, i3, s3) {
        var r2, n2 = arguments.length, o2 = n2 < 3 ? t3 : s3 === null ? s3 = Object.getOwnPropertyDescriptor(t3, i3) : s3;
        if (typeof Reflect == "object" && typeof Reflect.decorate == "function")
          o2 = Reflect.decorate(e3, t3, i3, s3);
        else
          for (var a2 = e3.length - 1;a2 >= 0; a2--)
            (r2 = e3[a2]) && (o2 = (n2 < 3 ? r2(o2) : n2 > 3 ? r2(t3, i3, o2) : r2(t3, i3)) || o2);
        return n2 > 3 && o2 && Object.defineProperty(t3, i3, o2), o2;
      }, r = this && this.__param || function(e3, t3) {
        return function(i3, s3) {
          t3(i3, s3, e3);
        };
      };
      Object.defineProperty(t2, "__esModule", { value: true }), t2.Viewport = undefined;
      const n = i2(3656), o = i2(4725), a = i2(8460), h = i2(844), c = i2(2585);
      let l = t2.Viewport = class extends h.Disposable {
        constructor(e3, t3, i3, s3, r2, o2, h2, c2) {
          super(), this._viewportElement = e3, this._scrollArea = t3, this._bufferService = i3, this._optionsService = s3, this._charSizeService = r2, this._renderService = o2, this._coreBrowserService = h2, this.scrollBarWidth = 0, this._currentRowHeight = 0, this._currentDeviceCellHeight = 0, this._lastRecordedBufferLength = 0, this._lastRecordedViewportHeight = 0, this._lastRecordedBufferHeight = 0, this._lastTouchY = 0, this._lastScrollTop = 0, this._wheelPartialScroll = 0, this._refreshAnimationFrame = null, this._ignoreNextScrollEvent = false, this._smoothScrollState = { startTime: 0, origin: -1, target: -1 }, this._onRequestScrollLines = this.register(new a.EventEmitter), this.onRequestScrollLines = this._onRequestScrollLines.event, this.scrollBarWidth = this._viewportElement.offsetWidth - this._scrollArea.offsetWidth || 15, this.register((0, n.addDisposableDomListener)(this._viewportElement, "scroll", this._handleScroll.bind(this))), this._activeBuffer = this._bufferService.buffer, this.register(this._bufferService.buffers.onBufferActivate((e4) => this._activeBuffer = e4.activeBuffer)), this._renderDimensions = this._renderService.dimensions, this.register(this._renderService.onDimensionsChange((e4) => this._renderDimensions = e4)), this._handleThemeChange(c2.colors), this.register(c2.onChangeColors((e4) => this._handleThemeChange(e4))), this.register(this._optionsService.onSpecificOptionChange("scrollback", () => this.syncScrollArea())), setTimeout(() => this.syncScrollArea());
        }
        _handleThemeChange(e3) {
          this._viewportElement.style.backgroundColor = e3.background.css;
        }
        reset() {
          this._currentRowHeight = 0, this._currentDeviceCellHeight = 0, this._lastRecordedBufferLength = 0, this._lastRecordedViewportHeight = 0, this._lastRecordedBufferHeight = 0, this._lastTouchY = 0, this._lastScrollTop = 0, this._coreBrowserService.window.requestAnimationFrame(() => this.syncScrollArea());
        }
        _refresh(e3) {
          if (e3)
            return this._innerRefresh(), void (this._refreshAnimationFrame !== null && this._coreBrowserService.window.cancelAnimationFrame(this._refreshAnimationFrame));
          this._refreshAnimationFrame === null && (this._refreshAnimationFrame = this._coreBrowserService.window.requestAnimationFrame(() => this._innerRefresh()));
        }
        _innerRefresh() {
          if (this._charSizeService.height > 0) {
            this._currentRowHeight = this._renderDimensions.device.cell.height / this._coreBrowserService.dpr, this._currentDeviceCellHeight = this._renderDimensions.device.cell.height, this._lastRecordedViewportHeight = this._viewportElement.offsetHeight;
            const e4 = Math.round(this._currentRowHeight * this._lastRecordedBufferLength) + (this._lastRecordedViewportHeight - this._renderDimensions.css.canvas.height);
            this._lastRecordedBufferHeight !== e4 && (this._lastRecordedBufferHeight = e4, this._scrollArea.style.height = this._lastRecordedBufferHeight + "px");
          }
          const e3 = this._bufferService.buffer.ydisp * this._currentRowHeight;
          this._viewportElement.scrollTop !== e3 && (this._ignoreNextScrollEvent = true, this._viewportElement.scrollTop = e3), this._refreshAnimationFrame = null;
        }
        syncScrollArea(e3 = false) {
          if (this._lastRecordedBufferLength !== this._bufferService.buffer.lines.length)
            return this._lastRecordedBufferLength = this._bufferService.buffer.lines.length, void this._refresh(e3);
          this._lastRecordedViewportHeight === this._renderService.dimensions.css.canvas.height && this._lastScrollTop === this._activeBuffer.ydisp * this._currentRowHeight && this._renderDimensions.device.cell.height === this._currentDeviceCellHeight || this._refresh(e3);
        }
        _handleScroll(e3) {
          if (this._lastScrollTop = this._viewportElement.scrollTop, !this._viewportElement.offsetParent)
            return;
          if (this._ignoreNextScrollEvent)
            return this._ignoreNextScrollEvent = false, void this._onRequestScrollLines.fire({ amount: 0, suppressScrollEvent: true });
          const t3 = Math.round(this._lastScrollTop / this._currentRowHeight) - this._bufferService.buffer.ydisp;
          this._onRequestScrollLines.fire({ amount: t3, suppressScrollEvent: true });
        }
        _smoothScroll() {
          if (this._isDisposed || this._smoothScrollState.origin === -1 || this._smoothScrollState.target === -1)
            return;
          const e3 = this._smoothScrollPercent();
          this._viewportElement.scrollTop = this._smoothScrollState.origin + Math.round(e3 * (this._smoothScrollState.target - this._smoothScrollState.origin)), e3 < 1 ? this._coreBrowserService.window.requestAnimationFrame(() => this._smoothScroll()) : this._clearSmoothScrollState();
        }
        _smoothScrollPercent() {
          return this._optionsService.rawOptions.smoothScrollDuration && this._smoothScrollState.startTime ? Math.max(Math.min((Date.now() - this._smoothScrollState.startTime) / this._optionsService.rawOptions.smoothScrollDuration, 1), 0) : 1;
        }
        _clearSmoothScrollState() {
          this._smoothScrollState.startTime = 0, this._smoothScrollState.origin = -1, this._smoothScrollState.target = -1;
        }
        _bubbleScroll(e3, t3) {
          const i3 = this._viewportElement.scrollTop + this._lastRecordedViewportHeight;
          return !(t3 < 0 && this._viewportElement.scrollTop !== 0 || t3 > 0 && i3 < this._lastRecordedBufferHeight) || (e3.cancelable && e3.preventDefault(), false);
        }
        handleWheel(e3) {
          const t3 = this._getPixelsScrolled(e3);
          return t3 !== 0 && (this._optionsService.rawOptions.smoothScrollDuration ? (this._smoothScrollState.startTime = Date.now(), this._smoothScrollPercent() < 1 ? (this._smoothScrollState.origin = this._viewportElement.scrollTop, this._smoothScrollState.target === -1 ? this._smoothScrollState.target = this._viewportElement.scrollTop + t3 : this._smoothScrollState.target += t3, this._smoothScrollState.target = Math.max(Math.min(this._smoothScrollState.target, this._viewportElement.scrollHeight), 0), this._smoothScroll()) : this._clearSmoothScrollState()) : this._viewportElement.scrollTop += t3, this._bubbleScroll(e3, t3));
        }
        scrollLines(e3) {
          if (e3 !== 0)
            if (this._optionsService.rawOptions.smoothScrollDuration) {
              const t3 = e3 * this._currentRowHeight;
              this._smoothScrollState.startTime = Date.now(), this._smoothScrollPercent() < 1 ? (this._smoothScrollState.origin = this._viewportElement.scrollTop, this._smoothScrollState.target = this._smoothScrollState.origin + t3, this._smoothScrollState.target = Math.max(Math.min(this._smoothScrollState.target, this._viewportElement.scrollHeight), 0), this._smoothScroll()) : this._clearSmoothScrollState();
            } else
              this._onRequestScrollLines.fire({ amount: e3, suppressScrollEvent: false });
        }
        _getPixelsScrolled(e3) {
          if (e3.deltaY === 0 || e3.shiftKey)
            return 0;
          let t3 = this._applyScrollModifier(e3.deltaY, e3);
          return e3.deltaMode === WheelEvent.DOM_DELTA_LINE ? t3 *= this._currentRowHeight : e3.deltaMode === WheelEvent.DOM_DELTA_PAGE && (t3 *= this._currentRowHeight * this._bufferService.rows), t3;
        }
        getBufferElements(e3, t3) {
          let i3, s3 = "";
          const r2 = [], n2 = t3 ?? this._bufferService.buffer.lines.length, o2 = this._bufferService.buffer.lines;
          for (let t4 = e3;t4 < n2; t4++) {
            const e4 = o2.get(t4);
            if (!e4)
              continue;
            const n3 = o2.get(t4 + 1)?.isWrapped;
            if (s3 += e4.translateToString(!n3), !n3 || t4 === o2.length - 1) {
              const e5 = document.createElement("div");
              e5.textContent = s3, r2.push(e5), s3.length > 0 && (i3 = e5), s3 = "";
            }
          }
          return { bufferElements: r2, cursorElement: i3 };
        }
        getLinesScrolled(e3) {
          if (e3.deltaY === 0 || e3.shiftKey)
            return 0;
          let t3 = this._applyScrollModifier(e3.deltaY, e3);
          return e3.deltaMode === WheelEvent.DOM_DELTA_PIXEL ? (t3 /= this._currentRowHeight + 0, this._wheelPartialScroll += t3, t3 = Math.floor(Math.abs(this._wheelPartialScroll)) * (this._wheelPartialScroll > 0 ? 1 : -1), this._wheelPartialScroll %= 1) : e3.deltaMode === WheelEvent.DOM_DELTA_PAGE && (t3 *= this._bufferService.rows), t3;
        }
        _applyScrollModifier(e3, t3) {
          const i3 = this._optionsService.rawOptions.fastScrollModifier;
          return i3 === "alt" && t3.altKey || i3 === "ctrl" && t3.ctrlKey || i3 === "shift" && t3.shiftKey ? e3 * this._optionsService.rawOptions.fastScrollSensitivity * this._optionsService.rawOptions.scrollSensitivity : e3 * this._optionsService.rawOptions.scrollSensitivity;
        }
        handleTouchStart(e3) {
          this._lastTouchY = e3.touches[0].pageY;
        }
        handleTouchMove(e3) {
          const t3 = this._lastTouchY - e3.touches[0].pageY;
          return this._lastTouchY = e3.touches[0].pageY, t3 !== 0 && (this._viewportElement.scrollTop += t3, this._bubbleScroll(e3, t3));
        }
      };
      t2.Viewport = l = s2([r(2, c.IBufferService), r(3, c.IOptionsService), r(4, o.ICharSizeService), r(5, o.IRenderService), r(6, o.ICoreBrowserService), r(7, o.IThemeService)], l);
    }, 3107: function(e2, t2, i2) {
      var s2 = this && this.__decorate || function(e3, t3, i3, s3) {
        var r2, n2 = arguments.length, o2 = n2 < 3 ? t3 : s3 === null ? s3 = Object.getOwnPropertyDescriptor(t3, i3) : s3;
        if (typeof Reflect == "object" && typeof Reflect.decorate == "function")
          o2 = Reflect.decorate(e3, t3, i3, s3);
        else
          for (var a2 = e3.length - 1;a2 >= 0; a2--)
            (r2 = e3[a2]) && (o2 = (n2 < 3 ? r2(o2) : n2 > 3 ? r2(t3, i3, o2) : r2(t3, i3)) || o2);
        return n2 > 3 && o2 && Object.defineProperty(t3, i3, o2), o2;
      }, r = this && this.__param || function(e3, t3) {
        return function(i3, s3) {
          t3(i3, s3, e3);
        };
      };
      Object.defineProperty(t2, "__esModule", { value: true }), t2.BufferDecorationRenderer = undefined;
      const n = i2(4725), o = i2(844), a = i2(2585);
      let h = t2.BufferDecorationRenderer = class extends o.Disposable {
        constructor(e3, t3, i3, s3, r2) {
          super(), this._screenElement = e3, this._bufferService = t3, this._coreBrowserService = i3, this._decorationService = s3, this._renderService = r2, this._decorationElements = new Map, this._altBufferIsActive = false, this._dimensionsChanged = false, this._container = document.createElement("div"), this._container.classList.add("xterm-decoration-container"), this._screenElement.appendChild(this._container), this.register(this._renderService.onRenderedViewportChange(() => this._doRefreshDecorations())), this.register(this._renderService.onDimensionsChange(() => {
            this._dimensionsChanged = true, this._queueRefresh();
          })), this.register(this._coreBrowserService.onDprChange(() => this._queueRefresh())), this.register(this._bufferService.buffers.onBufferActivate(() => {
            this._altBufferIsActive = this._bufferService.buffer === this._bufferService.buffers.alt;
          })), this.register(this._decorationService.onDecorationRegistered(() => this._queueRefresh())), this.register(this._decorationService.onDecorationRemoved((e4) => this._removeDecoration(e4))), this.register((0, o.toDisposable)(() => {
            this._container.remove(), this._decorationElements.clear();
          }));
        }
        _queueRefresh() {
          this._animationFrame === undefined && (this._animationFrame = this._renderService.addRefreshCallback(() => {
            this._doRefreshDecorations(), this._animationFrame = undefined;
          }));
        }
        _doRefreshDecorations() {
          for (const e3 of this._decorationService.decorations)
            this._renderDecoration(e3);
          this._dimensionsChanged = false;
        }
        _renderDecoration(e3) {
          this._refreshStyle(e3), this._dimensionsChanged && this._refreshXPosition(e3);
        }
        _createElement(e3) {
          const t3 = this._coreBrowserService.mainDocument.createElement("div");
          t3.classList.add("xterm-decoration"), t3.classList.toggle("xterm-decoration-top-layer", e3?.options?.layer === "top"), t3.style.width = `${Math.round((e3.options.width || 1) * this._renderService.dimensions.css.cell.width)}px`, t3.style.height = (e3.options.height || 1) * this._renderService.dimensions.css.cell.height + "px", t3.style.top = (e3.marker.line - this._bufferService.buffers.active.ydisp) * this._renderService.dimensions.css.cell.height + "px", t3.style.lineHeight = `${this._renderService.dimensions.css.cell.height}px`;
          const i3 = e3.options.x ?? 0;
          return i3 && i3 > this._bufferService.cols && (t3.style.display = "none"), this._refreshXPosition(e3, t3), t3;
        }
        _refreshStyle(e3) {
          const t3 = e3.marker.line - this._bufferService.buffers.active.ydisp;
          if (t3 < 0 || t3 >= this._bufferService.rows)
            e3.element && (e3.element.style.display = "none", e3.onRenderEmitter.fire(e3.element));
          else {
            let i3 = this._decorationElements.get(e3);
            i3 || (i3 = this._createElement(e3), e3.element = i3, this._decorationElements.set(e3, i3), this._container.appendChild(i3), e3.onDispose(() => {
              this._decorationElements.delete(e3), i3.remove();
            })), i3.style.top = t3 * this._renderService.dimensions.css.cell.height + "px", i3.style.display = this._altBufferIsActive ? "none" : "block", e3.onRenderEmitter.fire(i3);
          }
        }
        _refreshXPosition(e3, t3 = e3.element) {
          if (!t3)
            return;
          const i3 = e3.options.x ?? 0;
          (e3.options.anchor || "left") === "right" ? t3.style.right = i3 ? i3 * this._renderService.dimensions.css.cell.width + "px" : "" : t3.style.left = i3 ? i3 * this._renderService.dimensions.css.cell.width + "px" : "";
        }
        _removeDecoration(e3) {
          this._decorationElements.get(e3)?.remove(), this._decorationElements.delete(e3), e3.dispose();
        }
      };
      t2.BufferDecorationRenderer = h = s2([r(1, a.IBufferService), r(2, n.ICoreBrowserService), r(3, a.IDecorationService), r(4, n.IRenderService)], h);
    }, 5871: (e2, t2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.ColorZoneStore = undefined, t2.ColorZoneStore = class {
        constructor() {
          this._zones = [], this._zonePool = [], this._zonePoolIndex = 0, this._linePadding = { full: 0, left: 0, center: 0, right: 0 };
        }
        get zones() {
          return this._zonePool.length = Math.min(this._zonePool.length, this._zones.length), this._zones;
        }
        clear() {
          this._zones.length = 0, this._zonePoolIndex = 0;
        }
        addDecoration(e3) {
          if (e3.options.overviewRulerOptions) {
            for (const t3 of this._zones)
              if (t3.color === e3.options.overviewRulerOptions.color && t3.position === e3.options.overviewRulerOptions.position) {
                if (this._lineIntersectsZone(t3, e3.marker.line))
                  return;
                if (this._lineAdjacentToZone(t3, e3.marker.line, e3.options.overviewRulerOptions.position))
                  return void this._addLineToZone(t3, e3.marker.line);
              }
            if (this._zonePoolIndex < this._zonePool.length)
              return this._zonePool[this._zonePoolIndex].color = e3.options.overviewRulerOptions.color, this._zonePool[this._zonePoolIndex].position = e3.options.overviewRulerOptions.position, this._zonePool[this._zonePoolIndex].startBufferLine = e3.marker.line, this._zonePool[this._zonePoolIndex].endBufferLine = e3.marker.line, void this._zones.push(this._zonePool[this._zonePoolIndex++]);
            this._zones.push({ color: e3.options.overviewRulerOptions.color, position: e3.options.overviewRulerOptions.position, startBufferLine: e3.marker.line, endBufferLine: e3.marker.line }), this._zonePool.push(this._zones[this._zones.length - 1]), this._zonePoolIndex++;
          }
        }
        setPadding(e3) {
          this._linePadding = e3;
        }
        _lineIntersectsZone(e3, t3) {
          return t3 >= e3.startBufferLine && t3 <= e3.endBufferLine;
        }
        _lineAdjacentToZone(e3, t3, i2) {
          return t3 >= e3.startBufferLine - this._linePadding[i2 || "full"] && t3 <= e3.endBufferLine + this._linePadding[i2 || "full"];
        }
        _addLineToZone(e3, t3) {
          e3.startBufferLine = Math.min(e3.startBufferLine, t3), e3.endBufferLine = Math.max(e3.endBufferLine, t3);
        }
      };
    }, 5744: function(e2, t2, i2) {
      var s2 = this && this.__decorate || function(e3, t3, i3, s3) {
        var r2, n2 = arguments.length, o2 = n2 < 3 ? t3 : s3 === null ? s3 = Object.getOwnPropertyDescriptor(t3, i3) : s3;
        if (typeof Reflect == "object" && typeof Reflect.decorate == "function")
          o2 = Reflect.decorate(e3, t3, i3, s3);
        else
          for (var a2 = e3.length - 1;a2 >= 0; a2--)
            (r2 = e3[a2]) && (o2 = (n2 < 3 ? r2(o2) : n2 > 3 ? r2(t3, i3, o2) : r2(t3, i3)) || o2);
        return n2 > 3 && o2 && Object.defineProperty(t3, i3, o2), o2;
      }, r = this && this.__param || function(e3, t3) {
        return function(i3, s3) {
          t3(i3, s3, e3);
        };
      };
      Object.defineProperty(t2, "__esModule", { value: true }), t2.OverviewRulerRenderer = undefined;
      const n = i2(5871), o = i2(4725), a = i2(844), h = i2(2585), c = { full: 0, left: 0, center: 0, right: 0 }, l = { full: 0, left: 0, center: 0, right: 0 }, d = { full: 0, left: 0, center: 0, right: 0 };
      let _ = t2.OverviewRulerRenderer = class extends a.Disposable {
        get _width() {
          return this._optionsService.options.overviewRulerWidth || 0;
        }
        constructor(e3, t3, i3, s3, r2, o2, h2) {
          super(), this._viewportElement = e3, this._screenElement = t3, this._bufferService = i3, this._decorationService = s3, this._renderService = r2, this._optionsService = o2, this._coreBrowserService = h2, this._colorZoneStore = new n.ColorZoneStore, this._shouldUpdateDimensions = true, this._shouldUpdateAnchor = true, this._lastKnownBufferLength = 0, this._canvas = this._coreBrowserService.mainDocument.createElement("canvas"), this._canvas.classList.add("xterm-decoration-overview-ruler"), this._refreshCanvasDimensions(), this._viewportElement.parentElement?.insertBefore(this._canvas, this._viewportElement);
          const c2 = this._canvas.getContext("2d");
          if (!c2)
            throw new Error("Ctx cannot be null");
          this._ctx = c2, this._registerDecorationListeners(), this._registerBufferChangeListeners(), this._registerDimensionChangeListeners(), this.register((0, a.toDisposable)(() => {
            this._canvas?.remove();
          }));
        }
        _registerDecorationListeners() {
          this.register(this._decorationService.onDecorationRegistered(() => this._queueRefresh(undefined, true))), this.register(this._decorationService.onDecorationRemoved(() => this._queueRefresh(undefined, true)));
        }
        _registerBufferChangeListeners() {
          this.register(this._renderService.onRenderedViewportChange(() => this._queueRefresh())), this.register(this._bufferService.buffers.onBufferActivate(() => {
            this._canvas.style.display = this._bufferService.buffer === this._bufferService.buffers.alt ? "none" : "block";
          })), this.register(this._bufferService.onScroll(() => {
            this._lastKnownBufferLength !== this._bufferService.buffers.normal.lines.length && (this._refreshDrawHeightConstants(), this._refreshColorZonePadding());
          }));
        }
        _registerDimensionChangeListeners() {
          this.register(this._renderService.onRender(() => {
            this._containerHeight && this._containerHeight === this._screenElement.clientHeight || (this._queueRefresh(true), this._containerHeight = this._screenElement.clientHeight);
          })), this.register(this._optionsService.onSpecificOptionChange("overviewRulerWidth", () => this._queueRefresh(true))), this.register(this._coreBrowserService.onDprChange(() => this._queueRefresh(true))), this._queueRefresh(true);
        }
        _refreshDrawConstants() {
          const e3 = Math.floor(this._canvas.width / 3), t3 = Math.ceil(this._canvas.width / 3);
          l.full = this._canvas.width, l.left = e3, l.center = t3, l.right = e3, this._refreshDrawHeightConstants(), d.full = 0, d.left = 0, d.center = l.left, d.right = l.left + l.center;
        }
        _refreshDrawHeightConstants() {
          c.full = Math.round(2 * this._coreBrowserService.dpr);
          const e3 = this._canvas.height / this._bufferService.buffer.lines.length, t3 = Math.round(Math.max(Math.min(e3, 12), 6) * this._coreBrowserService.dpr);
          c.left = t3, c.center = t3, c.right = t3;
        }
        _refreshColorZonePadding() {
          this._colorZoneStore.setPadding({ full: Math.floor(this._bufferService.buffers.active.lines.length / (this._canvas.height - 1) * c.full), left: Math.floor(this._bufferService.buffers.active.lines.length / (this._canvas.height - 1) * c.left), center: Math.floor(this._bufferService.buffers.active.lines.length / (this._canvas.height - 1) * c.center), right: Math.floor(this._bufferService.buffers.active.lines.length / (this._canvas.height - 1) * c.right) }), this._lastKnownBufferLength = this._bufferService.buffers.normal.lines.length;
        }
        _refreshCanvasDimensions() {
          this._canvas.style.width = `${this._width}px`, this._canvas.width = Math.round(this._width * this._coreBrowserService.dpr), this._canvas.style.height = `${this._screenElement.clientHeight}px`, this._canvas.height = Math.round(this._screenElement.clientHeight * this._coreBrowserService.dpr), this._refreshDrawConstants(), this._refreshColorZonePadding();
        }
        _refreshDecorations() {
          this._shouldUpdateDimensions && this._refreshCanvasDimensions(), this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height), this._colorZoneStore.clear();
          for (const e4 of this._decorationService.decorations)
            this._colorZoneStore.addDecoration(e4);
          this._ctx.lineWidth = 1;
          const e3 = this._colorZoneStore.zones;
          for (const t3 of e3)
            t3.position !== "full" && this._renderColorZone(t3);
          for (const t3 of e3)
            t3.position === "full" && this._renderColorZone(t3);
          this._shouldUpdateDimensions = false, this._shouldUpdateAnchor = false;
        }
        _renderColorZone(e3) {
          this._ctx.fillStyle = e3.color, this._ctx.fillRect(d[e3.position || "full"], Math.round((this._canvas.height - 1) * (e3.startBufferLine / this._bufferService.buffers.active.lines.length) - c[e3.position || "full"] / 2), l[e3.position || "full"], Math.round((this._canvas.height - 1) * ((e3.endBufferLine - e3.startBufferLine) / this._bufferService.buffers.active.lines.length) + c[e3.position || "full"]));
        }
        _queueRefresh(e3, t3) {
          this._shouldUpdateDimensions = e3 || this._shouldUpdateDimensions, this._shouldUpdateAnchor = t3 || this._shouldUpdateAnchor, this._animationFrame === undefined && (this._animationFrame = this._coreBrowserService.window.requestAnimationFrame(() => {
            this._refreshDecorations(), this._animationFrame = undefined;
          }));
        }
      };
      t2.OverviewRulerRenderer = _ = s2([r(2, h.IBufferService), r(3, h.IDecorationService), r(4, o.IRenderService), r(5, h.IOptionsService), r(6, o.ICoreBrowserService)], _);
    }, 2950: function(e2, t2, i2) {
      var s2 = this && this.__decorate || function(e3, t3, i3, s3) {
        var r2, n2 = arguments.length, o2 = n2 < 3 ? t3 : s3 === null ? s3 = Object.getOwnPropertyDescriptor(t3, i3) : s3;
        if (typeof Reflect == "object" && typeof Reflect.decorate == "function")
          o2 = Reflect.decorate(e3, t3, i3, s3);
        else
          for (var a2 = e3.length - 1;a2 >= 0; a2--)
            (r2 = e3[a2]) && (o2 = (n2 < 3 ? r2(o2) : n2 > 3 ? r2(t3, i3, o2) : r2(t3, i3)) || o2);
        return n2 > 3 && o2 && Object.defineProperty(t3, i3, o2), o2;
      }, r = this && this.__param || function(e3, t3) {
        return function(i3, s3) {
          t3(i3, s3, e3);
        };
      };
      Object.defineProperty(t2, "__esModule", { value: true }), t2.CompositionHelper = undefined;
      const n = i2(4725), o = i2(2585), a = i2(2584);
      let h = t2.CompositionHelper = class {
        get isComposing() {
          return this._isComposing;
        }
        constructor(e3, t3, i3, s3, r2, n2) {
          this._textarea = e3, this._compositionView = t3, this._bufferService = i3, this._optionsService = s3, this._coreService = r2, this._renderService = n2, this._isComposing = false, this._isSendingComposition = false, this._compositionPosition = { start: 0, end: 0 }, this._dataAlreadySent = "";
        }
        compositionstart() {
          this._isComposing = true, this._compositionPosition.start = this._textarea.value.length, this._compositionView.textContent = "", this._dataAlreadySent = "", this._compositionView.classList.add("active");
        }
        compositionupdate(e3) {
          this._compositionView.textContent = e3.data, this.updateCompositionElements(), setTimeout(() => {
            this._compositionPosition.end = this._textarea.value.length;
          }, 0);
        }
        compositionend() {
          this._finalizeComposition(true);
        }
        keydown(e3) {
          if (this._isComposing || this._isSendingComposition) {
            if (e3.keyCode === 229)
              return false;
            if (e3.keyCode === 16 || e3.keyCode === 17 || e3.keyCode === 18)
              return false;
            this._finalizeComposition(false);
          }
          return e3.keyCode !== 229 || (this._handleAnyTextareaChanges(), false);
        }
        _finalizeComposition(e3) {
          if (this._compositionView.classList.remove("active"), this._isComposing = false, e3) {
            const e4 = { start: this._compositionPosition.start, end: this._compositionPosition.end };
            this._isSendingComposition = true, setTimeout(() => {
              if (this._isSendingComposition) {
                let t3;
                this._isSendingComposition = false, e4.start += this._dataAlreadySent.length, t3 = this._isComposing ? this._textarea.value.substring(e4.start, e4.end) : this._textarea.value.substring(e4.start), t3.length > 0 && this._coreService.triggerDataEvent(t3, true);
              }
            }, 0);
          } else {
            this._isSendingComposition = false;
            const e4 = this._textarea.value.substring(this._compositionPosition.start, this._compositionPosition.end);
            this._coreService.triggerDataEvent(e4, true);
          }
        }
        _handleAnyTextareaChanges() {
          const e3 = this._textarea.value;
          setTimeout(() => {
            if (!this._isComposing) {
              const t3 = this._textarea.value, i3 = t3.replace(e3, "");
              this._dataAlreadySent = i3, t3.length > e3.length ? this._coreService.triggerDataEvent(i3, true) : t3.length < e3.length ? this._coreService.triggerDataEvent(`${a.C0.DEL}`, true) : t3.length === e3.length && t3 !== e3 && this._coreService.triggerDataEvent(t3, true);
            }
          }, 0);
        }
        updateCompositionElements(e3) {
          if (this._isComposing) {
            if (this._bufferService.buffer.isCursorInViewport) {
              const e4 = Math.min(this._bufferService.buffer.x, this._bufferService.cols - 1), t3 = this._renderService.dimensions.css.cell.height, i3 = this._bufferService.buffer.y * this._renderService.dimensions.css.cell.height, s3 = e4 * this._renderService.dimensions.css.cell.width;
              this._compositionView.style.left = s3 + "px", this._compositionView.style.top = i3 + "px", this._compositionView.style.height = t3 + "px", this._compositionView.style.lineHeight = t3 + "px", this._compositionView.style.fontFamily = this._optionsService.rawOptions.fontFamily, this._compositionView.style.fontSize = this._optionsService.rawOptions.fontSize + "px";
              const r2 = this._compositionView.getBoundingClientRect();
              this._textarea.style.left = s3 + "px", this._textarea.style.top = i3 + "px", this._textarea.style.width = Math.max(r2.width, 1) + "px", this._textarea.style.height = Math.max(r2.height, 1) + "px", this._textarea.style.lineHeight = r2.height + "px";
            }
            e3 || setTimeout(() => this.updateCompositionElements(true), 0);
          }
        }
      };
      t2.CompositionHelper = h = s2([r(2, o.IBufferService), r(3, o.IOptionsService), r(4, o.ICoreService), r(5, n.IRenderService)], h);
    }, 9806: (e2, t2) => {
      function i2(e3, t3, i3) {
        const s2 = i3.getBoundingClientRect(), r = e3.getComputedStyle(i3), n = parseInt(r.getPropertyValue("padding-left")), o = parseInt(r.getPropertyValue("padding-top"));
        return [t3.clientX - s2.left - n, t3.clientY - s2.top - o];
      }
      Object.defineProperty(t2, "__esModule", { value: true }), t2.getCoords = t2.getCoordsRelativeToElement = undefined, t2.getCoordsRelativeToElement = i2, t2.getCoords = function(e3, t3, s2, r, n, o, a, h, c) {
        if (!o)
          return;
        const l = i2(e3, t3, s2);
        return l ? (l[0] = Math.ceil((l[0] + (c ? a / 2 : 0)) / a), l[1] = Math.ceil(l[1] / h), l[0] = Math.min(Math.max(l[0], 1), r + (c ? 1 : 0)), l[1] = Math.min(Math.max(l[1], 1), n), l) : undefined;
      };
    }, 9504: (e2, t2, i2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.moveToCellSequence = undefined;
      const s2 = i2(2584);
      function r(e3, t3, i3, s3) {
        const r2 = e3 - n(e3, i3), a2 = t3 - n(t3, i3), l = Math.abs(r2 - a2) - function(e4, t4, i4) {
          let s4 = 0;
          const r3 = e4 - n(e4, i4), a3 = t4 - n(t4, i4);
          for (let n2 = 0;n2 < Math.abs(r3 - a3); n2++) {
            const a4 = o(e4, t4) === "A" ? -1 : 1, h2 = i4.buffer.lines.get(r3 + a4 * n2);
            h2?.isWrapped && s4++;
          }
          return s4;
        }(e3, t3, i3);
        return c(l, h(o(e3, t3), s3));
      }
      function n(e3, t3) {
        let i3 = 0, s3 = t3.buffer.lines.get(e3), r2 = s3?.isWrapped;
        for (;r2 && e3 >= 0 && e3 < t3.rows; )
          i3++, s3 = t3.buffer.lines.get(--e3), r2 = s3?.isWrapped;
        return i3;
      }
      function o(e3, t3) {
        return e3 > t3 ? "A" : "B";
      }
      function a(e3, t3, i3, s3, r2, n2) {
        let o2 = e3, a2 = t3, h2 = "";
        for (;o2 !== i3 || a2 !== s3; )
          o2 += r2 ? 1 : -1, r2 && o2 > n2.cols - 1 ? (h2 += n2.buffer.translateBufferLineToString(a2, false, e3, o2), o2 = 0, e3 = 0, a2++) : !r2 && o2 < 0 && (h2 += n2.buffer.translateBufferLineToString(a2, false, 0, e3 + 1), o2 = n2.cols - 1, e3 = o2, a2--);
        return h2 + n2.buffer.translateBufferLineToString(a2, false, e3, o2);
      }
      function h(e3, t3) {
        const i3 = t3 ? "O" : "[";
        return s2.C0.ESC + i3 + e3;
      }
      function c(e3, t3) {
        e3 = Math.floor(e3);
        let i3 = "";
        for (let s3 = 0;s3 < e3; s3++)
          i3 += t3;
        return i3;
      }
      t2.moveToCellSequence = function(e3, t3, i3, s3) {
        const o2 = i3.buffer.x, l = i3.buffer.y;
        if (!i3.buffer.hasScrollback)
          return function(e4, t4, i4, s4, o3, l2) {
            return r(t4, s4, o3, l2).length === 0 ? "" : c(a(e4, t4, e4, t4 - n(t4, o3), false, o3).length, h("D", l2));
          }(o2, l, 0, t3, i3, s3) + r(l, t3, i3, s3) + function(e4, t4, i4, s4, o3, l2) {
            let d2;
            d2 = r(t4, s4, o3, l2).length > 0 ? s4 - n(s4, o3) : t4;
            const _2 = s4, u = function(e5, t5, i5, s5, o4, a2) {
              let h2;
              return h2 = r(i5, s5, o4, a2).length > 0 ? s5 - n(s5, o4) : t5, e5 < i5 && h2 <= s5 || e5 >= i5 && h2 < s5 ? "C" : "D";
            }(e4, t4, i4, s4, o3, l2);
            return c(a(e4, d2, i4, _2, u === "C", o3).length, h(u, l2));
          }(o2, l, e3, t3, i3, s3);
        let d;
        if (l === t3)
          return d = o2 > e3 ? "D" : "C", c(Math.abs(o2 - e3), h(d, s3));
        d = l > t3 ? "D" : "C";
        const _ = Math.abs(l - t3);
        return c(function(e4, t4) {
          return t4.cols - e4;
        }(l > t3 ? e3 : o2, i3) + (_ - 1) * i3.cols + 1 + ((l > t3 ? o2 : e3) - 1), h(d, s3));
      };
    }, 1296: function(e2, t2, i2) {
      var s2 = this && this.__decorate || function(e3, t3, i3, s3) {
        var r2, n2 = arguments.length, o2 = n2 < 3 ? t3 : s3 === null ? s3 = Object.getOwnPropertyDescriptor(t3, i3) : s3;
        if (typeof Reflect == "object" && typeof Reflect.decorate == "function")
          o2 = Reflect.decorate(e3, t3, i3, s3);
        else
          for (var a2 = e3.length - 1;a2 >= 0; a2--)
            (r2 = e3[a2]) && (o2 = (n2 < 3 ? r2(o2) : n2 > 3 ? r2(t3, i3, o2) : r2(t3, i3)) || o2);
        return n2 > 3 && o2 && Object.defineProperty(t3, i3, o2), o2;
      }, r = this && this.__param || function(e3, t3) {
        return function(i3, s3) {
          t3(i3, s3, e3);
        };
      };
      Object.defineProperty(t2, "__esModule", { value: true }), t2.DomRenderer = undefined;
      const n = i2(3787), o = i2(2550), a = i2(2223), h = i2(6171), c = i2(6052), l = i2(4725), d = i2(8055), _ = i2(8460), u = i2(844), f = i2(2585), v = "xterm-dom-renderer-owner-", p = "xterm-rows", g = "xterm-fg-", m = "xterm-bg-", S = "xterm-focus", C = "xterm-selection";
      let b = 1, w = t2.DomRenderer = class extends u.Disposable {
        constructor(e3, t3, i3, s3, r2, a2, l2, d2, f2, g2, m2, S2, w2) {
          super(), this._terminal = e3, this._document = t3, this._element = i3, this._screenElement = s3, this._viewportElement = r2, this._helperContainer = a2, this._linkifier2 = l2, this._charSizeService = f2, this._optionsService = g2, this._bufferService = m2, this._coreBrowserService = S2, this._themeService = w2, this._terminalClass = b++, this._rowElements = [], this._selectionRenderModel = (0, c.createSelectionRenderModel)(), this.onRequestRedraw = this.register(new _.EventEmitter).event, this._rowContainer = this._document.createElement("div"), this._rowContainer.classList.add(p), this._rowContainer.style.lineHeight = "normal", this._rowContainer.setAttribute("aria-hidden", "true"), this._refreshRowElements(this._bufferService.cols, this._bufferService.rows), this._selectionContainer = this._document.createElement("div"), this._selectionContainer.classList.add(C), this._selectionContainer.setAttribute("aria-hidden", "true"), this.dimensions = (0, h.createRenderDimensions)(), this._updateDimensions(), this.register(this._optionsService.onOptionChange(() => this._handleOptionsChanged())), this.register(this._themeService.onChangeColors((e4) => this._injectCss(e4))), this._injectCss(this._themeService.colors), this._rowFactory = d2.createInstance(n.DomRendererRowFactory, document), this._element.classList.add(v + this._terminalClass), this._screenElement.appendChild(this._rowContainer), this._screenElement.appendChild(this._selectionContainer), this.register(this._linkifier2.onShowLinkUnderline((e4) => this._handleLinkHover(e4))), this.register(this._linkifier2.onHideLinkUnderline((e4) => this._handleLinkLeave(e4))), this.register((0, u.toDisposable)(() => {
            this._element.classList.remove(v + this._terminalClass), this._rowContainer.remove(), this._selectionContainer.remove(), this._widthCache.dispose(), this._themeStyleElement.remove(), this._dimensionsStyleElement.remove();
          })), this._widthCache = new o.WidthCache(this._document, this._helperContainer), this._widthCache.setFont(this._optionsService.rawOptions.fontFamily, this._optionsService.rawOptions.fontSize, this._optionsService.rawOptions.fontWeight, this._optionsService.rawOptions.fontWeightBold), this._setDefaultSpacing();
        }
        _updateDimensions() {
          const e3 = this._coreBrowserService.dpr;
          this.dimensions.device.char.width = this._charSizeService.width * e3, this.dimensions.device.char.height = Math.ceil(this._charSizeService.height * e3), this.dimensions.device.cell.width = this.dimensions.device.char.width + Math.round(this._optionsService.rawOptions.letterSpacing), this.dimensions.device.cell.height = Math.floor(this.dimensions.device.char.height * this._optionsService.rawOptions.lineHeight), this.dimensions.device.char.left = 0, this.dimensions.device.char.top = 0, this.dimensions.device.canvas.width = this.dimensions.device.cell.width * this._bufferService.cols, this.dimensions.device.canvas.height = this.dimensions.device.cell.height * this._bufferService.rows, this.dimensions.css.canvas.width = Math.round(this.dimensions.device.canvas.width / e3), this.dimensions.css.canvas.height = Math.round(this.dimensions.device.canvas.height / e3), this.dimensions.css.cell.width = this.dimensions.css.canvas.width / this._bufferService.cols, this.dimensions.css.cell.height = this.dimensions.css.canvas.height / this._bufferService.rows;
          for (const e4 of this._rowElements)
            e4.style.width = `${this.dimensions.css.canvas.width}px`, e4.style.height = `${this.dimensions.css.cell.height}px`, e4.style.lineHeight = `${this.dimensions.css.cell.height}px`, e4.style.overflow = "hidden";
          this._dimensionsStyleElement || (this._dimensionsStyleElement = this._document.createElement("style"), this._screenElement.appendChild(this._dimensionsStyleElement));
          const t3 = `${this._terminalSelector} .${p} span { display: inline-block; height: 100%; vertical-align: top;}`;
          this._dimensionsStyleElement.textContent = t3, this._selectionContainer.style.height = this._viewportElement.style.height, this._screenElement.style.width = `${this.dimensions.css.canvas.width}px`, this._screenElement.style.height = `${this.dimensions.css.canvas.height}px`;
        }
        _injectCss(e3) {
          this._themeStyleElement || (this._themeStyleElement = this._document.createElement("style"), this._screenElement.appendChild(this._themeStyleElement));
          let t3 = `${this._terminalSelector} .${p} { color: ${e3.foreground.css}; font-family: ${this._optionsService.rawOptions.fontFamily}; font-size: ${this._optionsService.rawOptions.fontSize}px; font-kerning: none; white-space: pre}`;
          t3 += `${this._terminalSelector} .${p} .xterm-dim { color: ${d.color.multiplyOpacity(e3.foreground, 0.5).css};}`, t3 += `${this._terminalSelector} span:not(.xterm-bold) { font-weight: ${this._optionsService.rawOptions.fontWeight};}${this._terminalSelector} span.xterm-bold { font-weight: ${this._optionsService.rawOptions.fontWeightBold};}${this._terminalSelector} span.xterm-italic { font-style: italic;}`;
          const i3 = `blink_underline_${this._terminalClass}`, s3 = `blink_bar_${this._terminalClass}`, r2 = `blink_block_${this._terminalClass}`;
          t3 += `@keyframes ${i3} { 50% {  border-bottom-style: hidden; }}`, t3 += `@keyframes ${s3} { 50% {  box-shadow: none; }}`, t3 += `@keyframes ${r2} { 0% {  background-color: ${e3.cursor.css};  color: ${e3.cursorAccent.css}; } 50% {  background-color: inherit;  color: ${e3.cursor.css}; }}`, t3 += `${this._terminalSelector} .${p}.${S} .xterm-cursor.xterm-cursor-blink.xterm-cursor-underline { animation: ${i3} 1s step-end infinite;}${this._terminalSelector} .${p}.${S} .xterm-cursor.xterm-cursor-blink.xterm-cursor-bar { animation: ${s3} 1s step-end infinite;}${this._terminalSelector} .${p}.${S} .xterm-cursor.xterm-cursor-blink.xterm-cursor-block { animation: ${r2} 1s step-end infinite;}${this._terminalSelector} .${p} .xterm-cursor.xterm-cursor-block { background-color: ${e3.cursor.css}; color: ${e3.cursorAccent.css};}${this._terminalSelector} .${p} .xterm-cursor.xterm-cursor-block:not(.xterm-cursor-blink) { background-color: ${e3.cursor.css} !important; color: ${e3.cursorAccent.css} !important;}${this._terminalSelector} .${p} .xterm-cursor.xterm-cursor-outline { outline: 1px solid ${e3.cursor.css}; outline-offset: -1px;}${this._terminalSelector} .${p} .xterm-cursor.xterm-cursor-bar { box-shadow: ${this._optionsService.rawOptions.cursorWidth}px 0 0 ${e3.cursor.css} inset;}${this._terminalSelector} .${p} .xterm-cursor.xterm-cursor-underline { border-bottom: 1px ${e3.cursor.css}; border-bottom-style: solid; height: calc(100% - 1px);}`, t3 += `${this._terminalSelector} .${C} { position: absolute; top: 0; left: 0; z-index: 1; pointer-events: none;}${this._terminalSelector}.focus .${C} div { position: absolute; background-color: ${e3.selectionBackgroundOpaque.css};}${this._terminalSelector} .${C} div { position: absolute; background-color: ${e3.selectionInactiveBackgroundOpaque.css};}`;
          for (const [i4, s4] of e3.ansi.entries())
            t3 += `${this._terminalSelector} .${g}${i4} { color: ${s4.css}; }${this._terminalSelector} .${g}${i4}.xterm-dim { color: ${d.color.multiplyOpacity(s4, 0.5).css}; }${this._terminalSelector} .${m}${i4} { background-color: ${s4.css}; }`;
          t3 += `${this._terminalSelector} .${g}${a.INVERTED_DEFAULT_COLOR} { color: ${d.color.opaque(e3.background).css}; }${this._terminalSelector} .${g}${a.INVERTED_DEFAULT_COLOR}.xterm-dim { color: ${d.color.multiplyOpacity(d.color.opaque(e3.background), 0.5).css}; }${this._terminalSelector} .${m}${a.INVERTED_DEFAULT_COLOR} { background-color: ${e3.foreground.css}; }`, this._themeStyleElement.textContent = t3;
        }
        _setDefaultSpacing() {
          const e3 = this.dimensions.css.cell.width - this._widthCache.get("W", false, false);
          this._rowContainer.style.letterSpacing = `${e3}px`, this._rowFactory.defaultSpacing = e3;
        }
        handleDevicePixelRatioChange() {
          this._updateDimensions(), this._widthCache.clear(), this._setDefaultSpacing();
        }
        _refreshRowElements(e3, t3) {
          for (let e4 = this._rowElements.length;e4 <= t3; e4++) {
            const e5 = this._document.createElement("div");
            this._rowContainer.appendChild(e5), this._rowElements.push(e5);
          }
          for (;this._rowElements.length > t3; )
            this._rowContainer.removeChild(this._rowElements.pop());
        }
        handleResize(e3, t3) {
          this._refreshRowElements(e3, t3), this._updateDimensions(), this.handleSelectionChanged(this._selectionRenderModel.selectionStart, this._selectionRenderModel.selectionEnd, this._selectionRenderModel.columnSelectMode);
        }
        handleCharSizeChanged() {
          this._updateDimensions(), this._widthCache.clear(), this._setDefaultSpacing();
        }
        handleBlur() {
          this._rowContainer.classList.remove(S), this.renderRows(0, this._bufferService.rows - 1);
        }
        handleFocus() {
          this._rowContainer.classList.add(S), this.renderRows(this._bufferService.buffer.y, this._bufferService.buffer.y);
        }
        handleSelectionChanged(e3, t3, i3) {
          if (this._selectionContainer.replaceChildren(), this._rowFactory.handleSelectionChanged(e3, t3, i3), this.renderRows(0, this._bufferService.rows - 1), !e3 || !t3)
            return;
          this._selectionRenderModel.update(this._terminal, e3, t3, i3);
          const s3 = this._selectionRenderModel.viewportStartRow, r2 = this._selectionRenderModel.viewportEndRow, n2 = this._selectionRenderModel.viewportCappedStartRow, o2 = this._selectionRenderModel.viewportCappedEndRow;
          if (n2 >= this._bufferService.rows || o2 < 0)
            return;
          const a2 = this._document.createDocumentFragment();
          if (i3) {
            const i4 = e3[0] > t3[0];
            a2.appendChild(this._createSelectionElement(n2, i4 ? t3[0] : e3[0], i4 ? e3[0] : t3[0], o2 - n2 + 1));
          } else {
            const i4 = s3 === n2 ? e3[0] : 0, h2 = n2 === r2 ? t3[0] : this._bufferService.cols;
            a2.appendChild(this._createSelectionElement(n2, i4, h2));
            const c2 = o2 - n2 - 1;
            if (a2.appendChild(this._createSelectionElement(n2 + 1, 0, this._bufferService.cols, c2)), n2 !== o2) {
              const e4 = r2 === o2 ? t3[0] : this._bufferService.cols;
              a2.appendChild(this._createSelectionElement(o2, 0, e4));
            }
          }
          this._selectionContainer.appendChild(a2);
        }
        _createSelectionElement(e3, t3, i3, s3 = 1) {
          const r2 = this._document.createElement("div"), n2 = t3 * this.dimensions.css.cell.width;
          let o2 = this.dimensions.css.cell.width * (i3 - t3);
          return n2 + o2 > this.dimensions.css.canvas.width && (o2 = this.dimensions.css.canvas.width - n2), r2.style.height = s3 * this.dimensions.css.cell.height + "px", r2.style.top = e3 * this.dimensions.css.cell.height + "px", r2.style.left = `${n2}px`, r2.style.width = `${o2}px`, r2;
        }
        handleCursorMove() {}
        _handleOptionsChanged() {
          this._updateDimensions(), this._injectCss(this._themeService.colors), this._widthCache.setFont(this._optionsService.rawOptions.fontFamily, this._optionsService.rawOptions.fontSize, this._optionsService.rawOptions.fontWeight, this._optionsService.rawOptions.fontWeightBold), this._setDefaultSpacing();
        }
        clear() {
          for (const e3 of this._rowElements)
            e3.replaceChildren();
        }
        renderRows(e3, t3) {
          const i3 = this._bufferService.buffer, s3 = i3.ybase + i3.y, r2 = Math.min(i3.x, this._bufferService.cols - 1), n2 = this._optionsService.rawOptions.cursorBlink, o2 = this._optionsService.rawOptions.cursorStyle, a2 = this._optionsService.rawOptions.cursorInactiveStyle;
          for (let h2 = e3;h2 <= t3; h2++) {
            const e4 = h2 + i3.ydisp, t4 = this._rowElements[h2], c2 = i3.lines.get(e4);
            if (!t4 || !c2)
              break;
            t4.replaceChildren(...this._rowFactory.createRow(c2, e4, e4 === s3, o2, a2, r2, n2, this.dimensions.css.cell.width, this._widthCache, -1, -1));
          }
        }
        get _terminalSelector() {
          return `.${v}${this._terminalClass}`;
        }
        _handleLinkHover(e3) {
          this._setCellUnderline(e3.x1, e3.x2, e3.y1, e3.y2, e3.cols, true);
        }
        _handleLinkLeave(e3) {
          this._setCellUnderline(e3.x1, e3.x2, e3.y1, e3.y2, e3.cols, false);
        }
        _setCellUnderline(e3, t3, i3, s3, r2, n2) {
          i3 < 0 && (e3 = 0), s3 < 0 && (t3 = 0);
          const o2 = this._bufferService.rows - 1;
          i3 = Math.max(Math.min(i3, o2), 0), s3 = Math.max(Math.min(s3, o2), 0), r2 = Math.min(r2, this._bufferService.cols);
          const a2 = this._bufferService.buffer, h2 = a2.ybase + a2.y, c2 = Math.min(a2.x, r2 - 1), l2 = this._optionsService.rawOptions.cursorBlink, d2 = this._optionsService.rawOptions.cursorStyle, _2 = this._optionsService.rawOptions.cursorInactiveStyle;
          for (let o3 = i3;o3 <= s3; ++o3) {
            const u2 = o3 + a2.ydisp, f2 = this._rowElements[o3], v2 = a2.lines.get(u2);
            if (!f2 || !v2)
              break;
            f2.replaceChildren(...this._rowFactory.createRow(v2, u2, u2 === h2, d2, _2, c2, l2, this.dimensions.css.cell.width, this._widthCache, n2 ? o3 === i3 ? e3 : 0 : -1, n2 ? (o3 === s3 ? t3 : r2) - 1 : -1));
          }
        }
      };
      t2.DomRenderer = w = s2([r(7, f.IInstantiationService), r(8, l.ICharSizeService), r(9, f.IOptionsService), r(10, f.IBufferService), r(11, l.ICoreBrowserService), r(12, l.IThemeService)], w);
    }, 3787: function(e2, t2, i2) {
      var s2 = this && this.__decorate || function(e3, t3, i3, s3) {
        var r2, n2 = arguments.length, o2 = n2 < 3 ? t3 : s3 === null ? s3 = Object.getOwnPropertyDescriptor(t3, i3) : s3;
        if (typeof Reflect == "object" && typeof Reflect.decorate == "function")
          o2 = Reflect.decorate(e3, t3, i3, s3);
        else
          for (var a2 = e3.length - 1;a2 >= 0; a2--)
            (r2 = e3[a2]) && (o2 = (n2 < 3 ? r2(o2) : n2 > 3 ? r2(t3, i3, o2) : r2(t3, i3)) || o2);
        return n2 > 3 && o2 && Object.defineProperty(t3, i3, o2), o2;
      }, r = this && this.__param || function(e3, t3) {
        return function(i3, s3) {
          t3(i3, s3, e3);
        };
      };
      Object.defineProperty(t2, "__esModule", { value: true }), t2.DomRendererRowFactory = undefined;
      const n = i2(2223), o = i2(643), a = i2(511), h = i2(2585), c = i2(8055), l = i2(4725), d = i2(4269), _ = i2(6171), u = i2(3734);
      let f = t2.DomRendererRowFactory = class {
        constructor(e3, t3, i3, s3, r2, n2, o2) {
          this._document = e3, this._characterJoinerService = t3, this._optionsService = i3, this._coreBrowserService = s3, this._coreService = r2, this._decorationService = n2, this._themeService = o2, this._workCell = new a.CellData, this._columnSelectMode = false, this.defaultSpacing = 0;
        }
        handleSelectionChanged(e3, t3, i3) {
          this._selectionStart = e3, this._selectionEnd = t3, this._columnSelectMode = i3;
        }
        createRow(e3, t3, i3, s3, r2, a2, h2, l2, _2, f2, p) {
          const g = [], m = this._characterJoinerService.getJoinedCharacters(t3), S = this._themeService.colors;
          let C, b = e3.getNoBgTrimmedLength();
          i3 && b < a2 + 1 && (b = a2 + 1);
          let w = 0, y = "", E = 0, k = 0, L = 0, D = false, R = 0, x = false, A = 0;
          const B = [], T = f2 !== -1 && p !== -1;
          for (let M = 0;M < b; M++) {
            e3.loadCell(M, this._workCell);
            let b2 = this._workCell.getWidth();
            if (b2 === 0)
              continue;
            let O = false, P = M, I = this._workCell;
            if (m.length > 0 && M === m[0][0]) {
              O = true;
              const t4 = m.shift();
              I = new d.JoinedCellData(this._workCell, e3.translateToString(true, t4[0], t4[1]), t4[1] - t4[0]), P = t4[1] - 1, b2 = I.getWidth();
            }
            const H = this._isCellInSelection(M, t3), F = i3 && M === a2, W = T && M >= f2 && M <= p;
            let U = false;
            this._decorationService.forEachDecorationAtCell(M, t3, undefined, (e4) => {
              U = true;
            });
            let N = I.getChars() || o.WHITESPACE_CELL_CHAR;
            if (N === " " && (I.isUnderline() || I.isOverline()) && (N = " "), A = b2 * l2 - _2.get(N, I.isBold(), I.isItalic()), C) {
              if (w && (H && x || !H && !x && I.bg === E) && (H && x && S.selectionForeground || I.fg === k) && I.extended.ext === L && W === D && A === R && !F && !O && !U) {
                I.isInvisible() ? y += o.WHITESPACE_CELL_CHAR : y += N, w++;
                continue;
              }
              w && (C.textContent = y), C = this._document.createElement("span"), w = 0, y = "";
            } else
              C = this._document.createElement("span");
            if (E = I.bg, k = I.fg, L = I.extended.ext, D = W, R = A, x = H, O && a2 >= M && a2 <= P && (a2 = M), !this._coreService.isCursorHidden && F && this._coreService.isCursorInitialized) {
              if (B.push("xterm-cursor"), this._coreBrowserService.isFocused)
                h2 && B.push("xterm-cursor-blink"), B.push(s3 === "bar" ? "xterm-cursor-bar" : s3 === "underline" ? "xterm-cursor-underline" : "xterm-cursor-block");
              else if (r2)
                switch (r2) {
                  case "outline":
                    B.push("xterm-cursor-outline");
                    break;
                  case "block":
                    B.push("xterm-cursor-block");
                    break;
                  case "bar":
                    B.push("xterm-cursor-bar");
                    break;
                  case "underline":
                    B.push("xterm-cursor-underline");
                }
            }
            if (I.isBold() && B.push("xterm-bold"), I.isItalic() && B.push("xterm-italic"), I.isDim() && B.push("xterm-dim"), y = I.isInvisible() ? o.WHITESPACE_CELL_CHAR : I.getChars() || o.WHITESPACE_CELL_CHAR, I.isUnderline() && (B.push(`xterm-underline-${I.extended.underlineStyle}`), y === " " && (y = " "), !I.isUnderlineColorDefault()))
              if (I.isUnderlineColorRGB())
                C.style.textDecorationColor = `rgb(${u.AttributeData.toColorRGB(I.getUnderlineColor()).join(",")})`;
              else {
                let e4 = I.getUnderlineColor();
                this._optionsService.rawOptions.drawBoldTextInBrightColors && I.isBold() && e4 < 8 && (e4 += 8), C.style.textDecorationColor = S.ansi[e4].css;
              }
            I.isOverline() && (B.push("xterm-overline"), y === " " && (y = " ")), I.isStrikethrough() && B.push("xterm-strikethrough"), W && (C.style.textDecoration = "underline");
            let $ = I.getFgColor(), j = I.getFgColorMode(), z = I.getBgColor(), K = I.getBgColorMode();
            const q = !!I.isInverse();
            if (q) {
              const e4 = $;
              $ = z, z = e4;
              const t4 = j;
              j = K, K = t4;
            }
            let V, G, X, J = false;
            switch (this._decorationService.forEachDecorationAtCell(M, t3, undefined, (e4) => {
              e4.options.layer !== "top" && J || (e4.backgroundColorRGB && (K = 50331648, z = e4.backgroundColorRGB.rgba >> 8 & 16777215, V = e4.backgroundColorRGB), e4.foregroundColorRGB && (j = 50331648, $ = e4.foregroundColorRGB.rgba >> 8 & 16777215, G = e4.foregroundColorRGB), J = e4.options.layer === "top");
            }), !J && H && (V = this._coreBrowserService.isFocused ? S.selectionBackgroundOpaque : S.selectionInactiveBackgroundOpaque, z = V.rgba >> 8 & 16777215, K = 50331648, J = true, S.selectionForeground && (j = 50331648, $ = S.selectionForeground.rgba >> 8 & 16777215, G = S.selectionForeground)), J && B.push("xterm-decoration-top"), K) {
              case 16777216:
              case 33554432:
                X = S.ansi[z], B.push(`xterm-bg-${z}`);
                break;
              case 50331648:
                X = c.channels.toColor(z >> 16, z >> 8 & 255, 255 & z), this._addStyle(C, `background-color:#${v((z >>> 0).toString(16), "0", 6)}`);
                break;
              default:
                q ? (X = S.foreground, B.push(`xterm-bg-${n.INVERTED_DEFAULT_COLOR}`)) : X = S.background;
            }
            switch (V || I.isDim() && (V = c.color.multiplyOpacity(X, 0.5)), j) {
              case 16777216:
              case 33554432:
                I.isBold() && $ < 8 && this._optionsService.rawOptions.drawBoldTextInBrightColors && ($ += 8), this._applyMinimumContrast(C, X, S.ansi[$], I, V, undefined) || B.push(`xterm-fg-${$}`);
                break;
              case 50331648:
                const e4 = c.channels.toColor($ >> 16 & 255, $ >> 8 & 255, 255 & $);
                this._applyMinimumContrast(C, X, e4, I, V, G) || this._addStyle(C, `color:#${v($.toString(16), "0", 6)}`);
                break;
              default:
                this._applyMinimumContrast(C, X, S.foreground, I, V, G) || q && B.push(`xterm-fg-${n.INVERTED_DEFAULT_COLOR}`);
            }
            B.length && (C.className = B.join(" "), B.length = 0), F || O || U ? C.textContent = y : w++, A !== this.defaultSpacing && (C.style.letterSpacing = `${A}px`), g.push(C), M = P;
          }
          return C && w && (C.textContent = y), g;
        }
        _applyMinimumContrast(e3, t3, i3, s3, r2, n2) {
          if (this._optionsService.rawOptions.minimumContrastRatio === 1 || (0, _.treatGlyphAsBackgroundColor)(s3.getCode()))
            return false;
          const o2 = this._getContrastCache(s3);
          let a2;
          if (r2 || n2 || (a2 = o2.getColor(t3.rgba, i3.rgba)), a2 === undefined) {
            const e4 = this._optionsService.rawOptions.minimumContrastRatio / (s3.isDim() ? 2 : 1);
            a2 = c.color.ensureContrastRatio(r2 || t3, n2 || i3, e4), o2.setColor((r2 || t3).rgba, (n2 || i3).rgba, a2 ?? null);
          }
          return !!a2 && (this._addStyle(e3, `color:${a2.css}`), true);
        }
        _getContrastCache(e3) {
          return e3.isDim() ? this._themeService.colors.halfContrastCache : this._themeService.colors.contrastCache;
        }
        _addStyle(e3, t3) {
          e3.setAttribute("style", `${e3.getAttribute("style") || ""}${t3};`);
        }
        _isCellInSelection(e3, t3) {
          const i3 = this._selectionStart, s3 = this._selectionEnd;
          return !(!i3 || !s3) && (this._columnSelectMode ? i3[0] <= s3[0] ? e3 >= i3[0] && t3 >= i3[1] && e3 < s3[0] && t3 <= s3[1] : e3 < i3[0] && t3 >= i3[1] && e3 >= s3[0] && t3 <= s3[1] : t3 > i3[1] && t3 < s3[1] || i3[1] === s3[1] && t3 === i3[1] && e3 >= i3[0] && e3 < s3[0] || i3[1] < s3[1] && t3 === s3[1] && e3 < s3[0] || i3[1] < s3[1] && t3 === i3[1] && e3 >= i3[0]);
        }
      };
      function v(e3, t3, i3) {
        for (;e3.length < i3; )
          e3 = t3 + e3;
        return e3;
      }
      t2.DomRendererRowFactory = f = s2([r(1, l.ICharacterJoinerService), r(2, h.IOptionsService), r(3, l.ICoreBrowserService), r(4, h.ICoreService), r(5, h.IDecorationService), r(6, l.IThemeService)], f);
    }, 2550: (e2, t2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.WidthCache = undefined, t2.WidthCache = class {
        constructor(e3, t3) {
          this._flat = new Float32Array(256), this._font = "", this._fontSize = 0, this._weight = "normal", this._weightBold = "bold", this._measureElements = [], this._container = e3.createElement("div"), this._container.classList.add("xterm-width-cache-measure-container"), this._container.setAttribute("aria-hidden", "true"), this._container.style.whiteSpace = "pre", this._container.style.fontKerning = "none";
          const i2 = e3.createElement("span");
          i2.classList.add("xterm-char-measure-element");
          const s2 = e3.createElement("span");
          s2.classList.add("xterm-char-measure-element"), s2.style.fontWeight = "bold";
          const r = e3.createElement("span");
          r.classList.add("xterm-char-measure-element"), r.style.fontStyle = "italic";
          const n = e3.createElement("span");
          n.classList.add("xterm-char-measure-element"), n.style.fontWeight = "bold", n.style.fontStyle = "italic", this._measureElements = [i2, s2, r, n], this._container.appendChild(i2), this._container.appendChild(s2), this._container.appendChild(r), this._container.appendChild(n), t3.appendChild(this._container), this.clear();
        }
        dispose() {
          this._container.remove(), this._measureElements.length = 0, this._holey = undefined;
        }
        clear() {
          this._flat.fill(-9999), this._holey = new Map;
        }
        setFont(e3, t3, i2, s2) {
          e3 === this._font && t3 === this._fontSize && i2 === this._weight && s2 === this._weightBold || (this._font = e3, this._fontSize = t3, this._weight = i2, this._weightBold = s2, this._container.style.fontFamily = this._font, this._container.style.fontSize = `${this._fontSize}px`, this._measureElements[0].style.fontWeight = `${i2}`, this._measureElements[1].style.fontWeight = `${s2}`, this._measureElements[2].style.fontWeight = `${i2}`, this._measureElements[3].style.fontWeight = `${s2}`, this.clear());
        }
        get(e3, t3, i2) {
          let s2 = 0;
          if (!t3 && !i2 && e3.length === 1 && (s2 = e3.charCodeAt(0)) < 256) {
            if (this._flat[s2] !== -9999)
              return this._flat[s2];
            const t4 = this._measure(e3, 0);
            return t4 > 0 && (this._flat[s2] = t4), t4;
          }
          let r = e3;
          t3 && (r += "B"), i2 && (r += "I");
          let n = this._holey.get(r);
          if (n === undefined) {
            let s3 = 0;
            t3 && (s3 |= 1), i2 && (s3 |= 2), n = this._measure(e3, s3), n > 0 && this._holey.set(r, n);
          }
          return n;
        }
        _measure(e3, t3) {
          const i2 = this._measureElements[t3];
          return i2.textContent = e3.repeat(32), i2.offsetWidth / 32;
        }
      };
    }, 2223: (e2, t2, i2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.TEXT_BASELINE = t2.DIM_OPACITY = t2.INVERTED_DEFAULT_COLOR = undefined;
      const s2 = i2(6114);
      t2.INVERTED_DEFAULT_COLOR = 257, t2.DIM_OPACITY = 0.5, t2.TEXT_BASELINE = s2.isFirefox || s2.isLegacyEdge ? "bottom" : "ideographic";
    }, 6171: (e2, t2) => {
      function i2(e3) {
        return 57508 <= e3 && e3 <= 57558;
      }
      function s2(e3) {
        return e3 >= 128512 && e3 <= 128591 || e3 >= 127744 && e3 <= 128511 || e3 >= 128640 && e3 <= 128767 || e3 >= 9728 && e3 <= 9983 || e3 >= 9984 && e3 <= 10175 || e3 >= 65024 && e3 <= 65039 || e3 >= 129280 && e3 <= 129535 || e3 >= 127462 && e3 <= 127487;
      }
      Object.defineProperty(t2, "__esModule", { value: true }), t2.computeNextVariantOffset = t2.createRenderDimensions = t2.treatGlyphAsBackgroundColor = t2.allowRescaling = t2.isEmoji = t2.isRestrictedPowerlineGlyph = t2.isPowerlineGlyph = t2.throwIfFalsy = undefined, t2.throwIfFalsy = function(e3) {
        if (!e3)
          throw new Error("value must not be falsy");
        return e3;
      }, t2.isPowerlineGlyph = i2, t2.isRestrictedPowerlineGlyph = function(e3) {
        return 57520 <= e3 && e3 <= 57527;
      }, t2.isEmoji = s2, t2.allowRescaling = function(e3, t3, r, n) {
        return t3 === 1 && r > Math.ceil(1.5 * n) && e3 !== undefined && e3 > 255 && !s2(e3) && !i2(e3) && !function(e4) {
          return 57344 <= e4 && e4 <= 63743;
        }(e3);
      }, t2.treatGlyphAsBackgroundColor = function(e3) {
        return i2(e3) || function(e4) {
          return 9472 <= e4 && e4 <= 9631;
        }(e3);
      }, t2.createRenderDimensions = function() {
        return { css: { canvas: { width: 0, height: 0 }, cell: { width: 0, height: 0 } }, device: { canvas: { width: 0, height: 0 }, cell: { width: 0, height: 0 }, char: { width: 0, height: 0, left: 0, top: 0 } } };
      }, t2.computeNextVariantOffset = function(e3, t3, i3 = 0) {
        return (e3 - (2 * Math.round(t3) - i3)) % (2 * Math.round(t3));
      };
    }, 6052: (e2, t2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.createSelectionRenderModel = undefined;

      class i2 {
        constructor() {
          this.clear();
        }
        clear() {
          this.hasSelection = false, this.columnSelectMode = false, this.viewportStartRow = 0, this.viewportEndRow = 0, this.viewportCappedStartRow = 0, this.viewportCappedEndRow = 0, this.startCol = 0, this.endCol = 0, this.selectionStart = undefined, this.selectionEnd = undefined;
        }
        update(e3, t3, i3, s2 = false) {
          if (this.selectionStart = t3, this.selectionEnd = i3, !t3 || !i3 || t3[0] === i3[0] && t3[1] === i3[1])
            return void this.clear();
          const r = e3.buffers.active.ydisp, n = t3[1] - r, o = i3[1] - r, a = Math.max(n, 0), h = Math.min(o, e3.rows - 1);
          a >= e3.rows || h < 0 ? this.clear() : (this.hasSelection = true, this.columnSelectMode = s2, this.viewportStartRow = n, this.viewportEndRow = o, this.viewportCappedStartRow = a, this.viewportCappedEndRow = h, this.startCol = t3[0], this.endCol = i3[0]);
        }
        isCellSelected(e3, t3, i3) {
          return !!this.hasSelection && (i3 -= e3.buffer.active.viewportY, this.columnSelectMode ? this.startCol <= this.endCol ? t3 >= this.startCol && i3 >= this.viewportCappedStartRow && t3 < this.endCol && i3 <= this.viewportCappedEndRow : t3 < this.startCol && i3 >= this.viewportCappedStartRow && t3 >= this.endCol && i3 <= this.viewportCappedEndRow : i3 > this.viewportStartRow && i3 < this.viewportEndRow || this.viewportStartRow === this.viewportEndRow && i3 === this.viewportStartRow && t3 >= this.startCol && t3 < this.endCol || this.viewportStartRow < this.viewportEndRow && i3 === this.viewportEndRow && t3 < this.endCol || this.viewportStartRow < this.viewportEndRow && i3 === this.viewportStartRow && t3 >= this.startCol);
        }
      }
      t2.createSelectionRenderModel = function() {
        return new i2;
      };
    }, 456: (e2, t2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.SelectionModel = undefined, t2.SelectionModel = class {
        constructor(e3) {
          this._bufferService = e3, this.isSelectAllActive = false, this.selectionStartLength = 0;
        }
        clearSelection() {
          this.selectionStart = undefined, this.selectionEnd = undefined, this.isSelectAllActive = false, this.selectionStartLength = 0;
        }
        get finalSelectionStart() {
          return this.isSelectAllActive ? [0, 0] : this.selectionEnd && this.selectionStart && this.areSelectionValuesReversed() ? this.selectionEnd : this.selectionStart;
        }
        get finalSelectionEnd() {
          if (this.isSelectAllActive)
            return [this._bufferService.cols, this._bufferService.buffer.ybase + this._bufferService.rows - 1];
          if (this.selectionStart) {
            if (!this.selectionEnd || this.areSelectionValuesReversed()) {
              const e3 = this.selectionStart[0] + this.selectionStartLength;
              return e3 > this._bufferService.cols ? e3 % this._bufferService.cols == 0 ? [this._bufferService.cols, this.selectionStart[1] + Math.floor(e3 / this._bufferService.cols) - 1] : [e3 % this._bufferService.cols, this.selectionStart[1] + Math.floor(e3 / this._bufferService.cols)] : [e3, this.selectionStart[1]];
            }
            if (this.selectionStartLength && this.selectionEnd[1] === this.selectionStart[1]) {
              const e3 = this.selectionStart[0] + this.selectionStartLength;
              return e3 > this._bufferService.cols ? [e3 % this._bufferService.cols, this.selectionStart[1] + Math.floor(e3 / this._bufferService.cols)] : [Math.max(e3, this.selectionEnd[0]), this.selectionEnd[1]];
            }
            return this.selectionEnd;
          }
        }
        areSelectionValuesReversed() {
          const e3 = this.selectionStart, t3 = this.selectionEnd;
          return !(!e3 || !t3) && (e3[1] > t3[1] || e3[1] === t3[1] && e3[0] > t3[0]);
        }
        handleTrim(e3) {
          return this.selectionStart && (this.selectionStart[1] -= e3), this.selectionEnd && (this.selectionEnd[1] -= e3), this.selectionEnd && this.selectionEnd[1] < 0 ? (this.clearSelection(), true) : (this.selectionStart && this.selectionStart[1] < 0 && (this.selectionStart[1] = 0), false);
        }
      };
    }, 428: function(e2, t2, i2) {
      var s2 = this && this.__decorate || function(e3, t3, i3, s3) {
        var r2, n2 = arguments.length, o2 = n2 < 3 ? t3 : s3 === null ? s3 = Object.getOwnPropertyDescriptor(t3, i3) : s3;
        if (typeof Reflect == "object" && typeof Reflect.decorate == "function")
          o2 = Reflect.decorate(e3, t3, i3, s3);
        else
          for (var a2 = e3.length - 1;a2 >= 0; a2--)
            (r2 = e3[a2]) && (o2 = (n2 < 3 ? r2(o2) : n2 > 3 ? r2(t3, i3, o2) : r2(t3, i3)) || o2);
        return n2 > 3 && o2 && Object.defineProperty(t3, i3, o2), o2;
      }, r = this && this.__param || function(e3, t3) {
        return function(i3, s3) {
          t3(i3, s3, e3);
        };
      };
      Object.defineProperty(t2, "__esModule", { value: true }), t2.CharSizeService = undefined;
      const n = i2(2585), o = i2(8460), a = i2(844);
      let h = t2.CharSizeService = class extends a.Disposable {
        get hasValidSize() {
          return this.width > 0 && this.height > 0;
        }
        constructor(e3, t3, i3) {
          super(), this._optionsService = i3, this.width = 0, this.height = 0, this._onCharSizeChange = this.register(new o.EventEmitter), this.onCharSizeChange = this._onCharSizeChange.event;
          try {
            this._measureStrategy = this.register(new d(this._optionsService));
          } catch {
            this._measureStrategy = this.register(new l(e3, t3, this._optionsService));
          }
          this.register(this._optionsService.onMultipleOptionChange(["fontFamily", "fontSize"], () => this.measure()));
        }
        measure() {
          const e3 = this._measureStrategy.measure();
          e3.width === this.width && e3.height === this.height || (this.width = e3.width, this.height = e3.height, this._onCharSizeChange.fire());
        }
      };
      t2.CharSizeService = h = s2([r(2, n.IOptionsService)], h);

      class c extends a.Disposable {
        constructor() {
          super(...arguments), this._result = { width: 0, height: 0 };
        }
        _validateAndSet(e3, t3) {
          e3 !== undefined && e3 > 0 && t3 !== undefined && t3 > 0 && (this._result.width = e3, this._result.height = t3);
        }
      }

      class l extends c {
        constructor(e3, t3, i3) {
          super(), this._document = e3, this._parentElement = t3, this._optionsService = i3, this._measureElement = this._document.createElement("span"), this._measureElement.classList.add("xterm-char-measure-element"), this._measureElement.textContent = "W".repeat(32), this._measureElement.setAttribute("aria-hidden", "true"), this._measureElement.style.whiteSpace = "pre", this._measureElement.style.fontKerning = "none", this._parentElement.appendChild(this._measureElement);
        }
        measure() {
          return this._measureElement.style.fontFamily = this._optionsService.rawOptions.fontFamily, this._measureElement.style.fontSize = `${this._optionsService.rawOptions.fontSize}px`, this._validateAndSet(Number(this._measureElement.offsetWidth) / 32, Number(this._measureElement.offsetHeight)), this._result;
        }
      }

      class d extends c {
        constructor(e3) {
          super(), this._optionsService = e3, this._canvas = new OffscreenCanvas(100, 100), this._ctx = this._canvas.getContext("2d");
          const t3 = this._ctx.measureText("W");
          if (!(("width" in t3) && ("fontBoundingBoxAscent" in t3) && ("fontBoundingBoxDescent" in t3)))
            throw new Error("Required font metrics not supported");
        }
        measure() {
          this._ctx.font = `${this._optionsService.rawOptions.fontSize}px ${this._optionsService.rawOptions.fontFamily}`;
          const e3 = this._ctx.measureText("W");
          return this._validateAndSet(e3.width, e3.fontBoundingBoxAscent + e3.fontBoundingBoxDescent), this._result;
        }
      }
    }, 4269: function(e2, t2, i2) {
      var s2 = this && this.__decorate || function(e3, t3, i3, s3) {
        var r2, n2 = arguments.length, o2 = n2 < 3 ? t3 : s3 === null ? s3 = Object.getOwnPropertyDescriptor(t3, i3) : s3;
        if (typeof Reflect == "object" && typeof Reflect.decorate == "function")
          o2 = Reflect.decorate(e3, t3, i3, s3);
        else
          for (var a2 = e3.length - 1;a2 >= 0; a2--)
            (r2 = e3[a2]) && (o2 = (n2 < 3 ? r2(o2) : n2 > 3 ? r2(t3, i3, o2) : r2(t3, i3)) || o2);
        return n2 > 3 && o2 && Object.defineProperty(t3, i3, o2), o2;
      }, r = this && this.__param || function(e3, t3) {
        return function(i3, s3) {
          t3(i3, s3, e3);
        };
      };
      Object.defineProperty(t2, "__esModule", { value: true }), t2.CharacterJoinerService = t2.JoinedCellData = undefined;
      const n = i2(3734), o = i2(643), a = i2(511), h = i2(2585);

      class c extends n.AttributeData {
        constructor(e3, t3, i3) {
          super(), this.content = 0, this.combinedData = "", this.fg = e3.fg, this.bg = e3.bg, this.combinedData = t3, this._width = i3;
        }
        isCombined() {
          return 2097152;
        }
        getWidth() {
          return this._width;
        }
        getChars() {
          return this.combinedData;
        }
        getCode() {
          return 2097151;
        }
        setFromCharData(e3) {
          throw new Error("not implemented");
        }
        getAsCharData() {
          return [this.fg, this.getChars(), this.getWidth(), this.getCode()];
        }
      }
      t2.JoinedCellData = c;
      let l = t2.CharacterJoinerService = class e3 {
        constructor(e4) {
          this._bufferService = e4, this._characterJoiners = [], this._nextCharacterJoinerId = 0, this._workCell = new a.CellData;
        }
        register(e4) {
          const t3 = { id: this._nextCharacterJoinerId++, handler: e4 };
          return this._characterJoiners.push(t3), t3.id;
        }
        deregister(e4) {
          for (let t3 = 0;t3 < this._characterJoiners.length; t3++)
            if (this._characterJoiners[t3].id === e4)
              return this._characterJoiners.splice(t3, 1), true;
          return false;
        }
        getJoinedCharacters(e4) {
          if (this._characterJoiners.length === 0)
            return [];
          const t3 = this._bufferService.buffer.lines.get(e4);
          if (!t3 || t3.length === 0)
            return [];
          const i3 = [], s3 = t3.translateToString(true);
          let r2 = 0, n2 = 0, a2 = 0, h2 = t3.getFg(0), c2 = t3.getBg(0);
          for (let e5 = 0;e5 < t3.getTrimmedLength(); e5++)
            if (t3.loadCell(e5, this._workCell), this._workCell.getWidth() !== 0) {
              if (this._workCell.fg !== h2 || this._workCell.bg !== c2) {
                if (e5 - r2 > 1) {
                  const e6 = this._getJoinedRanges(s3, a2, n2, t3, r2);
                  for (let t4 = 0;t4 < e6.length; t4++)
                    i3.push(e6[t4]);
                }
                r2 = e5, a2 = n2, h2 = this._workCell.fg, c2 = this._workCell.bg;
              }
              n2 += this._workCell.getChars().length || o.WHITESPACE_CELL_CHAR.length;
            }
          if (this._bufferService.cols - r2 > 1) {
            const e5 = this._getJoinedRanges(s3, a2, n2, t3, r2);
            for (let t4 = 0;t4 < e5.length; t4++)
              i3.push(e5[t4]);
          }
          return i3;
        }
        _getJoinedRanges(t3, i3, s3, r2, n2) {
          const o2 = t3.substring(i3, s3);
          let a2 = [];
          try {
            a2 = this._characterJoiners[0].handler(o2);
          } catch (e4) {
            console.error(e4);
          }
          for (let t4 = 1;t4 < this._characterJoiners.length; t4++)
            try {
              const i4 = this._characterJoiners[t4].handler(o2);
              for (let t5 = 0;t5 < i4.length; t5++)
                e3._mergeRanges(a2, i4[t5]);
            } catch (e4) {
              console.error(e4);
            }
          return this._stringRangesToCellRanges(a2, r2, n2), a2;
        }
        _stringRangesToCellRanges(e4, t3, i3) {
          let s3 = 0, r2 = false, n2 = 0, a2 = e4[s3];
          if (a2) {
            for (let h2 = i3;h2 < this._bufferService.cols; h2++) {
              const i4 = t3.getWidth(h2), c2 = t3.getString(h2).length || o.WHITESPACE_CELL_CHAR.length;
              if (i4 !== 0) {
                if (!r2 && a2[0] <= n2 && (a2[0] = h2, r2 = true), a2[1] <= n2) {
                  if (a2[1] = h2, a2 = e4[++s3], !a2)
                    break;
                  a2[0] <= n2 ? (a2[0] = h2, r2 = true) : r2 = false;
                }
                n2 += c2;
              }
            }
            a2 && (a2[1] = this._bufferService.cols);
          }
        }
        static _mergeRanges(e4, t3) {
          let i3 = false;
          for (let s3 = 0;s3 < e4.length; s3++) {
            const r2 = e4[s3];
            if (i3) {
              if (t3[1] <= r2[0])
                return e4[s3 - 1][1] = t3[1], e4;
              if (t3[1] <= r2[1])
                return e4[s3 - 1][1] = Math.max(t3[1], r2[1]), e4.splice(s3, 1), e4;
              e4.splice(s3, 1), s3--;
            } else {
              if (t3[1] <= r2[0])
                return e4.splice(s3, 0, t3), e4;
              if (t3[1] <= r2[1])
                return r2[0] = Math.min(t3[0], r2[0]), e4;
              t3[0] < r2[1] && (r2[0] = Math.min(t3[0], r2[0]), i3 = true);
            }
          }
          return i3 ? e4[e4.length - 1][1] = t3[1] : e4.push(t3), e4;
        }
      };
      t2.CharacterJoinerService = l = s2([r(0, h.IBufferService)], l);
    }, 5114: (e2, t2, i2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.CoreBrowserService = undefined;
      const s2 = i2(844), r = i2(8460), n = i2(3656);

      class o extends s2.Disposable {
        constructor(e3, t3, i3) {
          super(), this._textarea = e3, this._window = t3, this.mainDocument = i3, this._isFocused = false, this._cachedIsFocused = undefined, this._screenDprMonitor = new a(this._window), this._onDprChange = this.register(new r.EventEmitter), this.onDprChange = this._onDprChange.event, this._onWindowChange = this.register(new r.EventEmitter), this.onWindowChange = this._onWindowChange.event, this.register(this.onWindowChange((e4) => this._screenDprMonitor.setWindow(e4))), this.register((0, r.forwardEvent)(this._screenDprMonitor.onDprChange, this._onDprChange)), this._textarea.addEventListener("focus", () => this._isFocused = true), this._textarea.addEventListener("blur", () => this._isFocused = false);
        }
        get window() {
          return this._window;
        }
        set window(e3) {
          this._window !== e3 && (this._window = e3, this._onWindowChange.fire(this._window));
        }
        get dpr() {
          return this.window.devicePixelRatio;
        }
        get isFocused() {
          return this._cachedIsFocused === undefined && (this._cachedIsFocused = this._isFocused && this._textarea.ownerDocument.hasFocus(), queueMicrotask(() => this._cachedIsFocused = undefined)), this._cachedIsFocused;
        }
      }
      t2.CoreBrowserService = o;

      class a extends s2.Disposable {
        constructor(e3) {
          super(), this._parentWindow = e3, this._windowResizeListener = this.register(new s2.MutableDisposable), this._onDprChange = this.register(new r.EventEmitter), this.onDprChange = this._onDprChange.event, this._outerListener = () => this._setDprAndFireIfDiffers(), this._currentDevicePixelRatio = this._parentWindow.devicePixelRatio, this._updateDpr(), this._setWindowResizeListener(), this.register((0, s2.toDisposable)(() => this.clearListener()));
        }
        setWindow(e3) {
          this._parentWindow = e3, this._setWindowResizeListener(), this._setDprAndFireIfDiffers();
        }
        _setWindowResizeListener() {
          this._windowResizeListener.value = (0, n.addDisposableDomListener)(this._parentWindow, "resize", () => this._setDprAndFireIfDiffers());
        }
        _setDprAndFireIfDiffers() {
          this._parentWindow.devicePixelRatio !== this._currentDevicePixelRatio && this._onDprChange.fire(this._parentWindow.devicePixelRatio), this._updateDpr();
        }
        _updateDpr() {
          this._outerListener && (this._resolutionMediaMatchList?.removeListener(this._outerListener), this._currentDevicePixelRatio = this._parentWindow.devicePixelRatio, this._resolutionMediaMatchList = this._parentWindow.matchMedia(`screen and (resolution: ${this._parentWindow.devicePixelRatio}dppx)`), this._resolutionMediaMatchList.addListener(this._outerListener));
        }
        clearListener() {
          this._resolutionMediaMatchList && this._outerListener && (this._resolutionMediaMatchList.removeListener(this._outerListener), this._resolutionMediaMatchList = undefined, this._outerListener = undefined);
        }
      }
    }, 779: (e2, t2, i2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.LinkProviderService = undefined;
      const s2 = i2(844);

      class r extends s2.Disposable {
        constructor() {
          super(), this.linkProviders = [], this.register((0, s2.toDisposable)(() => this.linkProviders.length = 0));
        }
        registerLinkProvider(e3) {
          return this.linkProviders.push(e3), { dispose: () => {
            const t3 = this.linkProviders.indexOf(e3);
            t3 !== -1 && this.linkProviders.splice(t3, 1);
          } };
        }
      }
      t2.LinkProviderService = r;
    }, 8934: function(e2, t2, i2) {
      var s2 = this && this.__decorate || function(e3, t3, i3, s3) {
        var r2, n2 = arguments.length, o2 = n2 < 3 ? t3 : s3 === null ? s3 = Object.getOwnPropertyDescriptor(t3, i3) : s3;
        if (typeof Reflect == "object" && typeof Reflect.decorate == "function")
          o2 = Reflect.decorate(e3, t3, i3, s3);
        else
          for (var a2 = e3.length - 1;a2 >= 0; a2--)
            (r2 = e3[a2]) && (o2 = (n2 < 3 ? r2(o2) : n2 > 3 ? r2(t3, i3, o2) : r2(t3, i3)) || o2);
        return n2 > 3 && o2 && Object.defineProperty(t3, i3, o2), o2;
      }, r = this && this.__param || function(e3, t3) {
        return function(i3, s3) {
          t3(i3, s3, e3);
        };
      };
      Object.defineProperty(t2, "__esModule", { value: true }), t2.MouseService = undefined;
      const n = i2(4725), o = i2(9806);
      let a = t2.MouseService = class {
        constructor(e3, t3) {
          this._renderService = e3, this._charSizeService = t3;
        }
        getCoords(e3, t3, i3, s3, r2) {
          return (0, o.getCoords)(window, e3, t3, i3, s3, this._charSizeService.hasValidSize, this._renderService.dimensions.css.cell.width, this._renderService.dimensions.css.cell.height, r2);
        }
        getMouseReportCoords(e3, t3) {
          const i3 = (0, o.getCoordsRelativeToElement)(window, e3, t3);
          if (this._charSizeService.hasValidSize)
            return i3[0] = Math.min(Math.max(i3[0], 0), this._renderService.dimensions.css.canvas.width - 1), i3[1] = Math.min(Math.max(i3[1], 0), this._renderService.dimensions.css.canvas.height - 1), { col: Math.floor(i3[0] / this._renderService.dimensions.css.cell.width), row: Math.floor(i3[1] / this._renderService.dimensions.css.cell.height), x: Math.floor(i3[0]), y: Math.floor(i3[1]) };
        }
      };
      t2.MouseService = a = s2([r(0, n.IRenderService), r(1, n.ICharSizeService)], a);
    }, 3230: function(e2, t2, i2) {
      var s2 = this && this.__decorate || function(e3, t3, i3, s3) {
        var r2, n2 = arguments.length, o2 = n2 < 3 ? t3 : s3 === null ? s3 = Object.getOwnPropertyDescriptor(t3, i3) : s3;
        if (typeof Reflect == "object" && typeof Reflect.decorate == "function")
          o2 = Reflect.decorate(e3, t3, i3, s3);
        else
          for (var a2 = e3.length - 1;a2 >= 0; a2--)
            (r2 = e3[a2]) && (o2 = (n2 < 3 ? r2(o2) : n2 > 3 ? r2(t3, i3, o2) : r2(t3, i3)) || o2);
        return n2 > 3 && o2 && Object.defineProperty(t3, i3, o2), o2;
      }, r = this && this.__param || function(e3, t3) {
        return function(i3, s3) {
          t3(i3, s3, e3);
        };
      };
      Object.defineProperty(t2, "__esModule", { value: true }), t2.RenderService = undefined;
      const n = i2(6193), o = i2(4725), a = i2(8460), h = i2(844), c = i2(7226), l = i2(2585);
      let d = t2.RenderService = class extends h.Disposable {
        get dimensions() {
          return this._renderer.value.dimensions;
        }
        constructor(e3, t3, i3, s3, r2, o2, l2, d2) {
          super(), this._rowCount = e3, this._charSizeService = s3, this._renderer = this.register(new h.MutableDisposable), this._pausedResizeTask = new c.DebouncedIdleTask, this._observerDisposable = this.register(new h.MutableDisposable), this._isPaused = false, this._needsFullRefresh = false, this._isNextRenderRedrawOnly = true, this._needsSelectionRefresh = false, this._canvasWidth = 0, this._canvasHeight = 0, this._selectionState = { start: undefined, end: undefined, columnSelectMode: false }, this._onDimensionsChange = this.register(new a.EventEmitter), this.onDimensionsChange = this._onDimensionsChange.event, this._onRenderedViewportChange = this.register(new a.EventEmitter), this.onRenderedViewportChange = this._onRenderedViewportChange.event, this._onRender = this.register(new a.EventEmitter), this.onRender = this._onRender.event, this._onRefreshRequest = this.register(new a.EventEmitter), this.onRefreshRequest = this._onRefreshRequest.event, this._renderDebouncer = new n.RenderDebouncer((e4, t4) => this._renderRows(e4, t4), l2), this.register(this._renderDebouncer), this.register(l2.onDprChange(() => this.handleDevicePixelRatioChange())), this.register(o2.onResize(() => this._fullRefresh())), this.register(o2.buffers.onBufferActivate(() => this._renderer.value?.clear())), this.register(i3.onOptionChange(() => this._handleOptionsChanged())), this.register(this._charSizeService.onCharSizeChange(() => this.handleCharSizeChanged())), this.register(r2.onDecorationRegistered(() => this._fullRefresh())), this.register(r2.onDecorationRemoved(() => this._fullRefresh())), this.register(i3.onMultipleOptionChange(["customGlyphs", "drawBoldTextInBrightColors", "letterSpacing", "lineHeight", "fontFamily", "fontSize", "fontWeight", "fontWeightBold", "minimumContrastRatio", "rescaleOverlappingGlyphs"], () => {
            this.clear(), this.handleResize(o2.cols, o2.rows), this._fullRefresh();
          })), this.register(i3.onMultipleOptionChange(["cursorBlink", "cursorStyle"], () => this.refreshRows(o2.buffer.y, o2.buffer.y, true))), this.register(d2.onChangeColors(() => this._fullRefresh())), this._registerIntersectionObserver(l2.window, t3), this.register(l2.onWindowChange((e4) => this._registerIntersectionObserver(e4, t3)));
        }
        _registerIntersectionObserver(e3, t3) {
          if ("IntersectionObserver" in e3) {
            const i3 = new e3.IntersectionObserver((e4) => this._handleIntersectionChange(e4[e4.length - 1]), { threshold: 0 });
            i3.observe(t3), this._observerDisposable.value = (0, h.toDisposable)(() => i3.disconnect());
          }
        }
        _handleIntersectionChange(e3) {
          this._isPaused = e3.isIntersecting === undefined ? e3.intersectionRatio === 0 : !e3.isIntersecting, this._isPaused || this._charSizeService.hasValidSize || this._charSizeService.measure(), !this._isPaused && this._needsFullRefresh && (this._pausedResizeTask.flush(), this.refreshRows(0, this._rowCount - 1), this._needsFullRefresh = false);
        }
        refreshRows(e3, t3, i3 = false) {
          this._isPaused ? this._needsFullRefresh = true : (i3 || (this._isNextRenderRedrawOnly = false), this._renderDebouncer.refresh(e3, t3, this._rowCount));
        }
        _renderRows(e3, t3) {
          this._renderer.value && (e3 = Math.min(e3, this._rowCount - 1), t3 = Math.min(t3, this._rowCount - 1), this._renderer.value.renderRows(e3, t3), this._needsSelectionRefresh && (this._renderer.value.handleSelectionChanged(this._selectionState.start, this._selectionState.end, this._selectionState.columnSelectMode), this._needsSelectionRefresh = false), this._isNextRenderRedrawOnly || this._onRenderedViewportChange.fire({ start: e3, end: t3 }), this._onRender.fire({ start: e3, end: t3 }), this._isNextRenderRedrawOnly = true);
        }
        resize(e3, t3) {
          this._rowCount = t3, this._fireOnCanvasResize();
        }
        _handleOptionsChanged() {
          this._renderer.value && (this.refreshRows(0, this._rowCount - 1), this._fireOnCanvasResize());
        }
        _fireOnCanvasResize() {
          this._renderer.value && (this._renderer.value.dimensions.css.canvas.width === this._canvasWidth && this._renderer.value.dimensions.css.canvas.height === this._canvasHeight || this._onDimensionsChange.fire(this._renderer.value.dimensions));
        }
        hasRenderer() {
          return !!this._renderer.value;
        }
        setRenderer(e3) {
          this._renderer.value = e3, this._renderer.value && (this._renderer.value.onRequestRedraw((e4) => this.refreshRows(e4.start, e4.end, true)), this._needsSelectionRefresh = true, this._fullRefresh());
        }
        addRefreshCallback(e3) {
          return this._renderDebouncer.addRefreshCallback(e3);
        }
        _fullRefresh() {
          this._isPaused ? this._needsFullRefresh = true : this.refreshRows(0, this._rowCount - 1);
        }
        clearTextureAtlas() {
          this._renderer.value && (this._renderer.value.clearTextureAtlas?.(), this._fullRefresh());
        }
        handleDevicePixelRatioChange() {
          this._charSizeService.measure(), this._renderer.value && (this._renderer.value.handleDevicePixelRatioChange(), this.refreshRows(0, this._rowCount - 1));
        }
        handleResize(e3, t3) {
          this._renderer.value && (this._isPaused ? this._pausedResizeTask.set(() => this._renderer.value?.handleResize(e3, t3)) : this._renderer.value.handleResize(e3, t3), this._fullRefresh());
        }
        handleCharSizeChanged() {
          this._renderer.value?.handleCharSizeChanged();
        }
        handleBlur() {
          this._renderer.value?.handleBlur();
        }
        handleFocus() {
          this._renderer.value?.handleFocus();
        }
        handleSelectionChanged(e3, t3, i3) {
          this._selectionState.start = e3, this._selectionState.end = t3, this._selectionState.columnSelectMode = i3, this._renderer.value?.handleSelectionChanged(e3, t3, i3);
        }
        handleCursorMove() {
          this._renderer.value?.handleCursorMove();
        }
        clear() {
          this._renderer.value?.clear();
        }
      };
      t2.RenderService = d = s2([r(2, l.IOptionsService), r(3, o.ICharSizeService), r(4, l.IDecorationService), r(5, l.IBufferService), r(6, o.ICoreBrowserService), r(7, o.IThemeService)], d);
    }, 9312: function(e2, t2, i2) {
      var s2 = this && this.__decorate || function(e3, t3, i3, s3) {
        var r2, n2 = arguments.length, o2 = n2 < 3 ? t3 : s3 === null ? s3 = Object.getOwnPropertyDescriptor(t3, i3) : s3;
        if (typeof Reflect == "object" && typeof Reflect.decorate == "function")
          o2 = Reflect.decorate(e3, t3, i3, s3);
        else
          for (var a2 = e3.length - 1;a2 >= 0; a2--)
            (r2 = e3[a2]) && (o2 = (n2 < 3 ? r2(o2) : n2 > 3 ? r2(t3, i3, o2) : r2(t3, i3)) || o2);
        return n2 > 3 && o2 && Object.defineProperty(t3, i3, o2), o2;
      }, r = this && this.__param || function(e3, t3) {
        return function(i3, s3) {
          t3(i3, s3, e3);
        };
      };
      Object.defineProperty(t2, "__esModule", { value: true }), t2.SelectionService = undefined;
      const n = i2(9806), o = i2(9504), a = i2(456), h = i2(4725), c = i2(8460), l = i2(844), d = i2(6114), _ = i2(4841), u = i2(511), f = i2(2585), v = String.fromCharCode(160), p = new RegExp(v, "g");
      let g = t2.SelectionService = class extends l.Disposable {
        constructor(e3, t3, i3, s3, r2, n2, o2, h2, d2) {
          super(), this._element = e3, this._screenElement = t3, this._linkifier = i3, this._bufferService = s3, this._coreService = r2, this._mouseService = n2, this._optionsService = o2, this._renderService = h2, this._coreBrowserService = d2, this._dragScrollAmount = 0, this._enabled = true, this._workCell = new u.CellData, this._mouseDownTimeStamp = 0, this._oldHasSelection = false, this._oldSelectionStart = undefined, this._oldSelectionEnd = undefined, this._onLinuxMouseSelection = this.register(new c.EventEmitter), this.onLinuxMouseSelection = this._onLinuxMouseSelection.event, this._onRedrawRequest = this.register(new c.EventEmitter), this.onRequestRedraw = this._onRedrawRequest.event, this._onSelectionChange = this.register(new c.EventEmitter), this.onSelectionChange = this._onSelectionChange.event, this._onRequestScrollLines = this.register(new c.EventEmitter), this.onRequestScrollLines = this._onRequestScrollLines.event, this._mouseMoveListener = (e4) => this._handleMouseMove(e4), this._mouseUpListener = (e4) => this._handleMouseUp(e4), this._coreService.onUserInput(() => {
            this.hasSelection && this.clearSelection();
          }), this._trimListener = this._bufferService.buffer.lines.onTrim((e4) => this._handleTrim(e4)), this.register(this._bufferService.buffers.onBufferActivate((e4) => this._handleBufferActivate(e4))), this.enable(), this._model = new a.SelectionModel(this._bufferService), this._activeSelectionMode = 0, this.register((0, l.toDisposable)(() => {
            this._removeMouseDownListeners();
          }));
        }
        reset() {
          this.clearSelection();
        }
        disable() {
          this.clearSelection(), this._enabled = false;
        }
        enable() {
          this._enabled = true;
        }
        get selectionStart() {
          return this._model.finalSelectionStart;
        }
        get selectionEnd() {
          return this._model.finalSelectionEnd;
        }
        get hasSelection() {
          const e3 = this._model.finalSelectionStart, t3 = this._model.finalSelectionEnd;
          return !(!e3 || !t3 || e3[0] === t3[0] && e3[1] === t3[1]);
        }
        get selectionText() {
          const e3 = this._model.finalSelectionStart, t3 = this._model.finalSelectionEnd;
          if (!e3 || !t3)
            return "";
          const i3 = this._bufferService.buffer, s3 = [];
          if (this._activeSelectionMode === 3) {
            if (e3[0] === t3[0])
              return "";
            const r2 = e3[0] < t3[0] ? e3[0] : t3[0], n2 = e3[0] < t3[0] ? t3[0] : e3[0];
            for (let o2 = e3[1];o2 <= t3[1]; o2++) {
              const e4 = i3.translateBufferLineToString(o2, true, r2, n2);
              s3.push(e4);
            }
          } else {
            const r2 = e3[1] === t3[1] ? t3[0] : undefined;
            s3.push(i3.translateBufferLineToString(e3[1], true, e3[0], r2));
            for (let r3 = e3[1] + 1;r3 <= t3[1] - 1; r3++) {
              const e4 = i3.lines.get(r3), t4 = i3.translateBufferLineToString(r3, true);
              e4?.isWrapped ? s3[s3.length - 1] += t4 : s3.push(t4);
            }
            if (e3[1] !== t3[1]) {
              const e4 = i3.lines.get(t3[1]), r3 = i3.translateBufferLineToString(t3[1], true, 0, t3[0]);
              e4 && e4.isWrapped ? s3[s3.length - 1] += r3 : s3.push(r3);
            }
          }
          return s3.map((e4) => e4.replace(p, " ")).join(d.isWindows ? `\r
` : `
`);
        }
        clearSelection() {
          this._model.clearSelection(), this._removeMouseDownListeners(), this.refresh(), this._onSelectionChange.fire();
        }
        refresh(e3) {
          this._refreshAnimationFrame || (this._refreshAnimationFrame = this._coreBrowserService.window.requestAnimationFrame(() => this._refresh())), d.isLinux && e3 && this.selectionText.length && this._onLinuxMouseSelection.fire(this.selectionText);
        }
        _refresh() {
          this._refreshAnimationFrame = undefined, this._onRedrawRequest.fire({ start: this._model.finalSelectionStart, end: this._model.finalSelectionEnd, columnSelectMode: this._activeSelectionMode === 3 });
        }
        _isClickInSelection(e3) {
          const t3 = this._getMouseBufferCoords(e3), i3 = this._model.finalSelectionStart, s3 = this._model.finalSelectionEnd;
          return !!(i3 && s3 && t3) && this._areCoordsInSelection(t3, i3, s3);
        }
        isCellInSelection(e3, t3) {
          const i3 = this._model.finalSelectionStart, s3 = this._model.finalSelectionEnd;
          return !(!i3 || !s3) && this._areCoordsInSelection([e3, t3], i3, s3);
        }
        _areCoordsInSelection(e3, t3, i3) {
          return e3[1] > t3[1] && e3[1] < i3[1] || t3[1] === i3[1] && e3[1] === t3[1] && e3[0] >= t3[0] && e3[0] < i3[0] || t3[1] < i3[1] && e3[1] === i3[1] && e3[0] < i3[0] || t3[1] < i3[1] && e3[1] === t3[1] && e3[0] >= t3[0];
        }
        _selectWordAtCursor(e3, t3) {
          const i3 = this._linkifier.currentLink?.link?.range;
          if (i3)
            return this._model.selectionStart = [i3.start.x - 1, i3.start.y - 1], this._model.selectionStartLength = (0, _.getRangeLength)(i3, this._bufferService.cols), this._model.selectionEnd = undefined, true;
          const s3 = this._getMouseBufferCoords(e3);
          return !!s3 && (this._selectWordAt(s3, t3), this._model.selectionEnd = undefined, true);
        }
        selectAll() {
          this._model.isSelectAllActive = true, this.refresh(), this._onSelectionChange.fire();
        }
        selectLines(e3, t3) {
          this._model.clearSelection(), e3 = Math.max(e3, 0), t3 = Math.min(t3, this._bufferService.buffer.lines.length - 1), this._model.selectionStart = [0, e3], this._model.selectionEnd = [this._bufferService.cols, t3], this.refresh(), this._onSelectionChange.fire();
        }
        _handleTrim(e3) {
          this._model.handleTrim(e3) && this.refresh();
        }
        _getMouseBufferCoords(e3) {
          const t3 = this._mouseService.getCoords(e3, this._screenElement, this._bufferService.cols, this._bufferService.rows, true);
          if (t3)
            return t3[0]--, t3[1]--, t3[1] += this._bufferService.buffer.ydisp, t3;
        }
        _getMouseEventScrollAmount(e3) {
          let t3 = (0, n.getCoordsRelativeToElement)(this._coreBrowserService.window, e3, this._screenElement)[1];
          const i3 = this._renderService.dimensions.css.canvas.height;
          return t3 >= 0 && t3 <= i3 ? 0 : (t3 > i3 && (t3 -= i3), t3 = Math.min(Math.max(t3, -50), 50), t3 /= 50, t3 / Math.abs(t3) + Math.round(14 * t3));
        }
        shouldForceSelection(e3) {
          return d.isMac ? e3.altKey && this._optionsService.rawOptions.macOptionClickForcesSelection : e3.shiftKey;
        }
        handleMouseDown(e3) {
          if (this._mouseDownTimeStamp = e3.timeStamp, (e3.button !== 2 || !this.hasSelection) && e3.button === 0) {
            if (!this._enabled) {
              if (!this.shouldForceSelection(e3))
                return;
              e3.stopPropagation();
            }
            e3.preventDefault(), this._dragScrollAmount = 0, this._enabled && e3.shiftKey ? this._handleIncrementalClick(e3) : e3.detail === 1 ? this._handleSingleClick(e3) : e3.detail === 2 ? this._handleDoubleClick(e3) : e3.detail === 3 && this._handleTripleClick(e3), this._addMouseDownListeners(), this.refresh(true);
          }
        }
        _addMouseDownListeners() {
          this._screenElement.ownerDocument && (this._screenElement.ownerDocument.addEventListener("mousemove", this._mouseMoveListener), this._screenElement.ownerDocument.addEventListener("mouseup", this._mouseUpListener)), this._dragScrollIntervalTimer = this._coreBrowserService.window.setInterval(() => this._dragScroll(), 50);
        }
        _removeMouseDownListeners() {
          this._screenElement.ownerDocument && (this._screenElement.ownerDocument.removeEventListener("mousemove", this._mouseMoveListener), this._screenElement.ownerDocument.removeEventListener("mouseup", this._mouseUpListener)), this._coreBrowserService.window.clearInterval(this._dragScrollIntervalTimer), this._dragScrollIntervalTimer = undefined;
        }
        _handleIncrementalClick(e3) {
          this._model.selectionStart && (this._model.selectionEnd = this._getMouseBufferCoords(e3));
        }
        _handleSingleClick(e3) {
          if (this._model.selectionStartLength = 0, this._model.isSelectAllActive = false, this._activeSelectionMode = this.shouldColumnSelect(e3) ? 3 : 0, this._model.selectionStart = this._getMouseBufferCoords(e3), !this._model.selectionStart)
            return;
          this._model.selectionEnd = undefined;
          const t3 = this._bufferService.buffer.lines.get(this._model.selectionStart[1]);
          t3 && t3.length !== this._model.selectionStart[0] && t3.hasWidth(this._model.selectionStart[0]) === 0 && this._model.selectionStart[0]++;
        }
        _handleDoubleClick(e3) {
          this._selectWordAtCursor(e3, true) && (this._activeSelectionMode = 1);
        }
        _handleTripleClick(e3) {
          const t3 = this._getMouseBufferCoords(e3);
          t3 && (this._activeSelectionMode = 2, this._selectLineAt(t3[1]));
        }
        shouldColumnSelect(e3) {
          return e3.altKey && !(d.isMac && this._optionsService.rawOptions.macOptionClickForcesSelection);
        }
        _handleMouseMove(e3) {
          if (e3.stopImmediatePropagation(), !this._model.selectionStart)
            return;
          const t3 = this._model.selectionEnd ? [this._model.selectionEnd[0], this._model.selectionEnd[1]] : null;
          if (this._model.selectionEnd = this._getMouseBufferCoords(e3), !this._model.selectionEnd)
            return void this.refresh(true);
          this._activeSelectionMode === 2 ? this._model.selectionEnd[1] < this._model.selectionStart[1] ? this._model.selectionEnd[0] = 0 : this._model.selectionEnd[0] = this._bufferService.cols : this._activeSelectionMode === 1 && this._selectToWordAt(this._model.selectionEnd), this._dragScrollAmount = this._getMouseEventScrollAmount(e3), this._activeSelectionMode !== 3 && (this._dragScrollAmount > 0 ? this._model.selectionEnd[0] = this._bufferService.cols : this._dragScrollAmount < 0 && (this._model.selectionEnd[0] = 0));
          const i3 = this._bufferService.buffer;
          if (this._model.selectionEnd[1] < i3.lines.length) {
            const e4 = i3.lines.get(this._model.selectionEnd[1]);
            e4 && e4.hasWidth(this._model.selectionEnd[0]) === 0 && this._model.selectionEnd[0] < this._bufferService.cols && this._model.selectionEnd[0]++;
          }
          t3 && t3[0] === this._model.selectionEnd[0] && t3[1] === this._model.selectionEnd[1] || this.refresh(true);
        }
        _dragScroll() {
          if (this._model.selectionEnd && this._model.selectionStart && this._dragScrollAmount) {
            this._onRequestScrollLines.fire({ amount: this._dragScrollAmount, suppressScrollEvent: false });
            const e3 = this._bufferService.buffer;
            this._dragScrollAmount > 0 ? (this._activeSelectionMode !== 3 && (this._model.selectionEnd[0] = this._bufferService.cols), this._model.selectionEnd[1] = Math.min(e3.ydisp + this._bufferService.rows, e3.lines.length - 1)) : (this._activeSelectionMode !== 3 && (this._model.selectionEnd[0] = 0), this._model.selectionEnd[1] = e3.ydisp), this.refresh();
          }
        }
        _handleMouseUp(e3) {
          const t3 = e3.timeStamp - this._mouseDownTimeStamp;
          if (this._removeMouseDownListeners(), this.selectionText.length <= 1 && t3 < 500 && e3.altKey && this._optionsService.rawOptions.altClickMovesCursor) {
            if (this._bufferService.buffer.ybase === this._bufferService.buffer.ydisp) {
              const t4 = this._mouseService.getCoords(e3, this._element, this._bufferService.cols, this._bufferService.rows, false);
              if (t4 && t4[0] !== undefined && t4[1] !== undefined) {
                const e4 = (0, o.moveToCellSequence)(t4[0] - 1, t4[1] - 1, this._bufferService, this._coreService.decPrivateModes.applicationCursorKeys);
                this._coreService.triggerDataEvent(e4, true);
              }
            }
          } else
            this._fireEventIfSelectionChanged();
        }
        _fireEventIfSelectionChanged() {
          const e3 = this._model.finalSelectionStart, t3 = this._model.finalSelectionEnd, i3 = !(!e3 || !t3 || e3[0] === t3[0] && e3[1] === t3[1]);
          i3 ? e3 && t3 && (this._oldSelectionStart && this._oldSelectionEnd && e3[0] === this._oldSelectionStart[0] && e3[1] === this._oldSelectionStart[1] && t3[0] === this._oldSelectionEnd[0] && t3[1] === this._oldSelectionEnd[1] || this._fireOnSelectionChange(e3, t3, i3)) : this._oldHasSelection && this._fireOnSelectionChange(e3, t3, i3);
        }
        _fireOnSelectionChange(e3, t3, i3) {
          this._oldSelectionStart = e3, this._oldSelectionEnd = t3, this._oldHasSelection = i3, this._onSelectionChange.fire();
        }
        _handleBufferActivate(e3) {
          this.clearSelection(), this._trimListener.dispose(), this._trimListener = e3.activeBuffer.lines.onTrim((e4) => this._handleTrim(e4));
        }
        _convertViewportColToCharacterIndex(e3, t3) {
          let i3 = t3;
          for (let s3 = 0;t3 >= s3; s3++) {
            const r2 = e3.loadCell(s3, this._workCell).getChars().length;
            this._workCell.getWidth() === 0 ? i3-- : r2 > 1 && t3 !== s3 && (i3 += r2 - 1);
          }
          return i3;
        }
        setSelection(e3, t3, i3) {
          this._model.clearSelection(), this._removeMouseDownListeners(), this._model.selectionStart = [e3, t3], this._model.selectionStartLength = i3, this.refresh(), this._fireEventIfSelectionChanged();
        }
        rightClickSelect(e3) {
          this._isClickInSelection(e3) || (this._selectWordAtCursor(e3, false) && this.refresh(true), this._fireEventIfSelectionChanged());
        }
        _getWordAt(e3, t3, i3 = true, s3 = true) {
          if (e3[0] >= this._bufferService.cols)
            return;
          const r2 = this._bufferService.buffer, n2 = r2.lines.get(e3[1]);
          if (!n2)
            return;
          const o2 = r2.translateBufferLineToString(e3[1], false);
          let a2 = this._convertViewportColToCharacterIndex(n2, e3[0]), h2 = a2;
          const c2 = e3[0] - a2;
          let l2 = 0, d2 = 0, _2 = 0, u2 = 0;
          if (o2.charAt(a2) === " ") {
            for (;a2 > 0 && o2.charAt(a2 - 1) === " "; )
              a2--;
            for (;h2 < o2.length && o2.charAt(h2 + 1) === " "; )
              h2++;
          } else {
            let t4 = e3[0], i4 = e3[0];
            n2.getWidth(t4) === 0 && (l2++, t4--), n2.getWidth(i4) === 2 && (d2++, i4++);
            const s4 = n2.getString(i4).length;
            for (s4 > 1 && (u2 += s4 - 1, h2 += s4 - 1);t4 > 0 && a2 > 0 && !this._isCharWordSeparator(n2.loadCell(t4 - 1, this._workCell)); ) {
              n2.loadCell(t4 - 1, this._workCell);
              const e4 = this._workCell.getChars().length;
              this._workCell.getWidth() === 0 ? (l2++, t4--) : e4 > 1 && (_2 += e4 - 1, a2 -= e4 - 1), a2--, t4--;
            }
            for (;i4 < n2.length && h2 + 1 < o2.length && !this._isCharWordSeparator(n2.loadCell(i4 + 1, this._workCell)); ) {
              n2.loadCell(i4 + 1, this._workCell);
              const e4 = this._workCell.getChars().length;
              this._workCell.getWidth() === 2 ? (d2++, i4++) : e4 > 1 && (u2 += e4 - 1, h2 += e4 - 1), h2++, i4++;
            }
          }
          h2++;
          let f2 = a2 + c2 - l2 + _2, v2 = Math.min(this._bufferService.cols, h2 - a2 + l2 + d2 - _2 - u2);
          if (t3 || o2.slice(a2, h2).trim() !== "") {
            if (i3 && f2 === 0 && n2.getCodePoint(0) !== 32) {
              const t4 = r2.lines.get(e3[1] - 1);
              if (t4 && n2.isWrapped && t4.getCodePoint(this._bufferService.cols - 1) !== 32) {
                const t5 = this._getWordAt([this._bufferService.cols - 1, e3[1] - 1], false, true, false);
                if (t5) {
                  const e4 = this._bufferService.cols - t5.start;
                  f2 -= e4, v2 += e4;
                }
              }
            }
            if (s3 && f2 + v2 === this._bufferService.cols && n2.getCodePoint(this._bufferService.cols - 1) !== 32) {
              const t4 = r2.lines.get(e3[1] + 1);
              if (t4?.isWrapped && t4.getCodePoint(0) !== 32) {
                const t5 = this._getWordAt([0, e3[1] + 1], false, false, true);
                t5 && (v2 += t5.length);
              }
            }
            return { start: f2, length: v2 };
          }
        }
        _selectWordAt(e3, t3) {
          const i3 = this._getWordAt(e3, t3);
          if (i3) {
            for (;i3.start < 0; )
              i3.start += this._bufferService.cols, e3[1]--;
            this._model.selectionStart = [i3.start, e3[1]], this._model.selectionStartLength = i3.length;
          }
        }
        _selectToWordAt(e3) {
          const t3 = this._getWordAt(e3, true);
          if (t3) {
            let i3 = e3[1];
            for (;t3.start < 0; )
              t3.start += this._bufferService.cols, i3--;
            if (!this._model.areSelectionValuesReversed())
              for (;t3.start + t3.length > this._bufferService.cols; )
                t3.length -= this._bufferService.cols, i3++;
            this._model.selectionEnd = [this._model.areSelectionValuesReversed() ? t3.start : t3.start + t3.length, i3];
          }
        }
        _isCharWordSeparator(e3) {
          return e3.getWidth() !== 0 && this._optionsService.rawOptions.wordSeparator.indexOf(e3.getChars()) >= 0;
        }
        _selectLineAt(e3) {
          const t3 = this._bufferService.buffer.getWrappedRangeForLine(e3), i3 = { start: { x: 0, y: t3.first }, end: { x: this._bufferService.cols - 1, y: t3.last } };
          this._model.selectionStart = [0, t3.first], this._model.selectionEnd = undefined, this._model.selectionStartLength = (0, _.getRangeLength)(i3, this._bufferService.cols);
        }
      };
      t2.SelectionService = g = s2([r(3, f.IBufferService), r(4, f.ICoreService), r(5, h.IMouseService), r(6, f.IOptionsService), r(7, h.IRenderService), r(8, h.ICoreBrowserService)], g);
    }, 4725: (e2, t2, i2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.ILinkProviderService = t2.IThemeService = t2.ICharacterJoinerService = t2.ISelectionService = t2.IRenderService = t2.IMouseService = t2.ICoreBrowserService = t2.ICharSizeService = undefined;
      const s2 = i2(8343);
      t2.ICharSizeService = (0, s2.createDecorator)("CharSizeService"), t2.ICoreBrowserService = (0, s2.createDecorator)("CoreBrowserService"), t2.IMouseService = (0, s2.createDecorator)("MouseService"), t2.IRenderService = (0, s2.createDecorator)("RenderService"), t2.ISelectionService = (0, s2.createDecorator)("SelectionService"), t2.ICharacterJoinerService = (0, s2.createDecorator)("CharacterJoinerService"), t2.IThemeService = (0, s2.createDecorator)("ThemeService"), t2.ILinkProviderService = (0, s2.createDecorator)("LinkProviderService");
    }, 6731: function(e2, t2, i2) {
      var s2 = this && this.__decorate || function(e3, t3, i3, s3) {
        var r2, n2 = arguments.length, o2 = n2 < 3 ? t3 : s3 === null ? s3 = Object.getOwnPropertyDescriptor(t3, i3) : s3;
        if (typeof Reflect == "object" && typeof Reflect.decorate == "function")
          o2 = Reflect.decorate(e3, t3, i3, s3);
        else
          for (var a2 = e3.length - 1;a2 >= 0; a2--)
            (r2 = e3[a2]) && (o2 = (n2 < 3 ? r2(o2) : n2 > 3 ? r2(t3, i3, o2) : r2(t3, i3)) || o2);
        return n2 > 3 && o2 && Object.defineProperty(t3, i3, o2), o2;
      }, r = this && this.__param || function(e3, t3) {
        return function(i3, s3) {
          t3(i3, s3, e3);
        };
      };
      Object.defineProperty(t2, "__esModule", { value: true }), t2.ThemeService = t2.DEFAULT_ANSI_COLORS = undefined;
      const n = i2(7239), o = i2(8055), a = i2(8460), h = i2(844), c = i2(2585), l = o.css.toColor("#ffffff"), d = o.css.toColor("#000000"), _ = o.css.toColor("#ffffff"), u = o.css.toColor("#000000"), f = { css: "rgba(255, 255, 255, 0.3)", rgba: 4294967117 };
      t2.DEFAULT_ANSI_COLORS = Object.freeze((() => {
        const e3 = [o.css.toColor("#2e3436"), o.css.toColor("#cc0000"), o.css.toColor("#4e9a06"), o.css.toColor("#c4a000"), o.css.toColor("#3465a4"), o.css.toColor("#75507b"), o.css.toColor("#06989a"), o.css.toColor("#d3d7cf"), o.css.toColor("#555753"), o.css.toColor("#ef2929"), o.css.toColor("#8ae234"), o.css.toColor("#fce94f"), o.css.toColor("#729fcf"), o.css.toColor("#ad7fa8"), o.css.toColor("#34e2e2"), o.css.toColor("#eeeeec")], t3 = [0, 95, 135, 175, 215, 255];
        for (let i3 = 0;i3 < 216; i3++) {
          const s3 = t3[i3 / 36 % 6 | 0], r2 = t3[i3 / 6 % 6 | 0], n2 = t3[i3 % 6];
          e3.push({ css: o.channels.toCss(s3, r2, n2), rgba: o.channels.toRgba(s3, r2, n2) });
        }
        for (let t4 = 0;t4 < 24; t4++) {
          const i3 = 8 + 10 * t4;
          e3.push({ css: o.channels.toCss(i3, i3, i3), rgba: o.channels.toRgba(i3, i3, i3) });
        }
        return e3;
      })());
      let v = t2.ThemeService = class extends h.Disposable {
        get colors() {
          return this._colors;
        }
        constructor(e3) {
          super(), this._optionsService = e3, this._contrastCache = new n.ColorContrastCache, this._halfContrastCache = new n.ColorContrastCache, this._onChangeColors = this.register(new a.EventEmitter), this.onChangeColors = this._onChangeColors.event, this._colors = { foreground: l, background: d, cursor: _, cursorAccent: u, selectionForeground: undefined, selectionBackgroundTransparent: f, selectionBackgroundOpaque: o.color.blend(d, f), selectionInactiveBackgroundTransparent: f, selectionInactiveBackgroundOpaque: o.color.blend(d, f), ansi: t2.DEFAULT_ANSI_COLORS.slice(), contrastCache: this._contrastCache, halfContrastCache: this._halfContrastCache }, this._updateRestoreColors(), this._setTheme(this._optionsService.rawOptions.theme), this.register(this._optionsService.onSpecificOptionChange("minimumContrastRatio", () => this._contrastCache.clear())), this.register(this._optionsService.onSpecificOptionChange("theme", () => this._setTheme(this._optionsService.rawOptions.theme)));
        }
        _setTheme(e3 = {}) {
          const i3 = this._colors;
          if (i3.foreground = p(e3.foreground, l), i3.background = p(e3.background, d), i3.cursor = p(e3.cursor, _), i3.cursorAccent = p(e3.cursorAccent, u), i3.selectionBackgroundTransparent = p(e3.selectionBackground, f), i3.selectionBackgroundOpaque = o.color.blend(i3.background, i3.selectionBackgroundTransparent), i3.selectionInactiveBackgroundTransparent = p(e3.selectionInactiveBackground, i3.selectionBackgroundTransparent), i3.selectionInactiveBackgroundOpaque = o.color.blend(i3.background, i3.selectionInactiveBackgroundTransparent), i3.selectionForeground = e3.selectionForeground ? p(e3.selectionForeground, o.NULL_COLOR) : undefined, i3.selectionForeground === o.NULL_COLOR && (i3.selectionForeground = undefined), o.color.isOpaque(i3.selectionBackgroundTransparent)) {
            const e4 = 0.3;
            i3.selectionBackgroundTransparent = o.color.opacity(i3.selectionBackgroundTransparent, e4);
          }
          if (o.color.isOpaque(i3.selectionInactiveBackgroundTransparent)) {
            const e4 = 0.3;
            i3.selectionInactiveBackgroundTransparent = o.color.opacity(i3.selectionInactiveBackgroundTransparent, e4);
          }
          if (i3.ansi = t2.DEFAULT_ANSI_COLORS.slice(), i3.ansi[0] = p(e3.black, t2.DEFAULT_ANSI_COLORS[0]), i3.ansi[1] = p(e3.red, t2.DEFAULT_ANSI_COLORS[1]), i3.ansi[2] = p(e3.green, t2.DEFAULT_ANSI_COLORS[2]), i3.ansi[3] = p(e3.yellow, t2.DEFAULT_ANSI_COLORS[3]), i3.ansi[4] = p(e3.blue, t2.DEFAULT_ANSI_COLORS[4]), i3.ansi[5] = p(e3.magenta, t2.DEFAULT_ANSI_COLORS[5]), i3.ansi[6] = p(e3.cyan, t2.DEFAULT_ANSI_COLORS[6]), i3.ansi[7] = p(e3.white, t2.DEFAULT_ANSI_COLORS[7]), i3.ansi[8] = p(e3.brightBlack, t2.DEFAULT_ANSI_COLORS[8]), i3.ansi[9] = p(e3.brightRed, t2.DEFAULT_ANSI_COLORS[9]), i3.ansi[10] = p(e3.brightGreen, t2.DEFAULT_ANSI_COLORS[10]), i3.ansi[11] = p(e3.brightYellow, t2.DEFAULT_ANSI_COLORS[11]), i3.ansi[12] = p(e3.brightBlue, t2.DEFAULT_ANSI_COLORS[12]), i3.ansi[13] = p(e3.brightMagenta, t2.DEFAULT_ANSI_COLORS[13]), i3.ansi[14] = p(e3.brightCyan, t2.DEFAULT_ANSI_COLORS[14]), i3.ansi[15] = p(e3.brightWhite, t2.DEFAULT_ANSI_COLORS[15]), e3.extendedAnsi) {
            const s3 = Math.min(i3.ansi.length - 16, e3.extendedAnsi.length);
            for (let r2 = 0;r2 < s3; r2++)
              i3.ansi[r2 + 16] = p(e3.extendedAnsi[r2], t2.DEFAULT_ANSI_COLORS[r2 + 16]);
          }
          this._contrastCache.clear(), this._halfContrastCache.clear(), this._updateRestoreColors(), this._onChangeColors.fire(this.colors);
        }
        restoreColor(e3) {
          this._restoreColor(e3), this._onChangeColors.fire(this.colors);
        }
        _restoreColor(e3) {
          if (e3 !== undefined)
            switch (e3) {
              case 256:
                this._colors.foreground = this._restoreColors.foreground;
                break;
              case 257:
                this._colors.background = this._restoreColors.background;
                break;
              case 258:
                this._colors.cursor = this._restoreColors.cursor;
                break;
              default:
                this._colors.ansi[e3] = this._restoreColors.ansi[e3];
            }
          else
            for (let e4 = 0;e4 < this._restoreColors.ansi.length; ++e4)
              this._colors.ansi[e4] = this._restoreColors.ansi[e4];
        }
        modifyColors(e3) {
          e3(this._colors), this._onChangeColors.fire(this.colors);
        }
        _updateRestoreColors() {
          this._restoreColors = { foreground: this._colors.foreground, background: this._colors.background, cursor: this._colors.cursor, ansi: this._colors.ansi.slice() };
        }
      };
      function p(e3, t3) {
        if (e3 !== undefined)
          try {
            return o.css.toColor(e3);
          } catch {}
        return t3;
      }
      t2.ThemeService = v = s2([r(0, c.IOptionsService)], v);
    }, 6349: (e2, t2, i2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.CircularList = undefined;
      const s2 = i2(8460), r = i2(844);

      class n extends r.Disposable {
        constructor(e3) {
          super(), this._maxLength = e3, this.onDeleteEmitter = this.register(new s2.EventEmitter), this.onDelete = this.onDeleteEmitter.event, this.onInsertEmitter = this.register(new s2.EventEmitter), this.onInsert = this.onInsertEmitter.event, this.onTrimEmitter = this.register(new s2.EventEmitter), this.onTrim = this.onTrimEmitter.event, this._array = new Array(this._maxLength), this._startIndex = 0, this._length = 0;
        }
        get maxLength() {
          return this._maxLength;
        }
        set maxLength(e3) {
          if (this._maxLength === e3)
            return;
          const t3 = new Array(e3);
          for (let i3 = 0;i3 < Math.min(e3, this.length); i3++)
            t3[i3] = this._array[this._getCyclicIndex(i3)];
          this._array = t3, this._maxLength = e3, this._startIndex = 0;
        }
        get length() {
          return this._length;
        }
        set length(e3) {
          if (e3 > this._length)
            for (let t3 = this._length;t3 < e3; t3++)
              this._array[t3] = undefined;
          this._length = e3;
        }
        get(e3) {
          return this._array[this._getCyclicIndex(e3)];
        }
        set(e3, t3) {
          this._array[this._getCyclicIndex(e3)] = t3;
        }
        push(e3) {
          this._array[this._getCyclicIndex(this._length)] = e3, this._length === this._maxLength ? (this._startIndex = ++this._startIndex % this._maxLength, this.onTrimEmitter.fire(1)) : this._length++;
        }
        recycle() {
          if (this._length !== this._maxLength)
            throw new Error("Can only recycle when the buffer is full");
          return this._startIndex = ++this._startIndex % this._maxLength, this.onTrimEmitter.fire(1), this._array[this._getCyclicIndex(this._length - 1)];
        }
        get isFull() {
          return this._length === this._maxLength;
        }
        pop() {
          return this._array[this._getCyclicIndex(this._length-- - 1)];
        }
        splice(e3, t3, ...i3) {
          if (t3) {
            for (let i4 = e3;i4 < this._length - t3; i4++)
              this._array[this._getCyclicIndex(i4)] = this._array[this._getCyclicIndex(i4 + t3)];
            this._length -= t3, this.onDeleteEmitter.fire({ index: e3, amount: t3 });
          }
          for (let t4 = this._length - 1;t4 >= e3; t4--)
            this._array[this._getCyclicIndex(t4 + i3.length)] = this._array[this._getCyclicIndex(t4)];
          for (let t4 = 0;t4 < i3.length; t4++)
            this._array[this._getCyclicIndex(e3 + t4)] = i3[t4];
          if (i3.length && this.onInsertEmitter.fire({ index: e3, amount: i3.length }), this._length + i3.length > this._maxLength) {
            const e4 = this._length + i3.length - this._maxLength;
            this._startIndex += e4, this._length = this._maxLength, this.onTrimEmitter.fire(e4);
          } else
            this._length += i3.length;
        }
        trimStart(e3) {
          e3 > this._length && (e3 = this._length), this._startIndex += e3, this._length -= e3, this.onTrimEmitter.fire(e3);
        }
        shiftElements(e3, t3, i3) {
          if (!(t3 <= 0)) {
            if (e3 < 0 || e3 >= this._length)
              throw new Error("start argument out of range");
            if (e3 + i3 < 0)
              throw new Error("Cannot shift elements in list beyond index 0");
            if (i3 > 0) {
              for (let s4 = t3 - 1;s4 >= 0; s4--)
                this.set(e3 + s4 + i3, this.get(e3 + s4));
              const s3 = e3 + t3 + i3 - this._length;
              if (s3 > 0)
                for (this._length += s3;this._length > this._maxLength; )
                  this._length--, this._startIndex++, this.onTrimEmitter.fire(1);
            } else
              for (let s3 = 0;s3 < t3; s3++)
                this.set(e3 + s3 + i3, this.get(e3 + s3));
          }
        }
        _getCyclicIndex(e3) {
          return (this._startIndex + e3) % this._maxLength;
        }
      }
      t2.CircularList = n;
    }, 1439: (e2, t2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.clone = undefined, t2.clone = function e(t3, i2 = 5) {
        if (typeof t3 != "object")
          return t3;
        const s2 = Array.isArray(t3) ? [] : {};
        for (const r in t3)
          s2[r] = i2 <= 1 ? t3[r] : t3[r] && e(t3[r], i2 - 1);
        return s2;
      };
    }, 8055: (e2, t2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.contrastRatio = t2.toPaddedHex = t2.rgba = t2.rgb = t2.css = t2.color = t2.channels = t2.NULL_COLOR = undefined;
      let i2 = 0, s2 = 0, r = 0, n = 0;
      var o, a, h, c, l;
      function d(e3) {
        const t3 = e3.toString(16);
        return t3.length < 2 ? "0" + t3 : t3;
      }
      function _(e3, t3) {
        return e3 < t3 ? (t3 + 0.05) / (e3 + 0.05) : (e3 + 0.05) / (t3 + 0.05);
      }
      t2.NULL_COLOR = { css: "#00000000", rgba: 0 }, function(e3) {
        e3.toCss = function(e4, t3, i3, s3) {
          return s3 !== undefined ? `#${d(e4)}${d(t3)}${d(i3)}${d(s3)}` : `#${d(e4)}${d(t3)}${d(i3)}`;
        }, e3.toRgba = function(e4, t3, i3, s3 = 255) {
          return (e4 << 24 | t3 << 16 | i3 << 8 | s3) >>> 0;
        }, e3.toColor = function(t3, i3, s3, r2) {
          return { css: e3.toCss(t3, i3, s3, r2), rgba: e3.toRgba(t3, i3, s3, r2) };
        };
      }(o || (t2.channels = o = {})), function(e3) {
        function t3(e4, t4) {
          return n = Math.round(255 * t4), [i2, s2, r] = l.toChannels(e4.rgba), { css: o.toCss(i2, s2, r, n), rgba: o.toRgba(i2, s2, r, n) };
        }
        e3.blend = function(e4, t4) {
          if (n = (255 & t4.rgba) / 255, n === 1)
            return { css: t4.css, rgba: t4.rgba };
          const a2 = t4.rgba >> 24 & 255, h2 = t4.rgba >> 16 & 255, c2 = t4.rgba >> 8 & 255, l2 = e4.rgba >> 24 & 255, d2 = e4.rgba >> 16 & 255, _2 = e4.rgba >> 8 & 255;
          return i2 = l2 + Math.round((a2 - l2) * n), s2 = d2 + Math.round((h2 - d2) * n), r = _2 + Math.round((c2 - _2) * n), { css: o.toCss(i2, s2, r), rgba: o.toRgba(i2, s2, r) };
        }, e3.isOpaque = function(e4) {
          return (255 & e4.rgba) == 255;
        }, e3.ensureContrastRatio = function(e4, t4, i3) {
          const s3 = l.ensureContrastRatio(e4.rgba, t4.rgba, i3);
          if (s3)
            return o.toColor(s3 >> 24 & 255, s3 >> 16 & 255, s3 >> 8 & 255);
        }, e3.opaque = function(e4) {
          const t4 = (255 | e4.rgba) >>> 0;
          return [i2, s2, r] = l.toChannels(t4), { css: o.toCss(i2, s2, r), rgba: t4 };
        }, e3.opacity = t3, e3.multiplyOpacity = function(e4, i3) {
          return n = 255 & e4.rgba, t3(e4, n * i3 / 255);
        }, e3.toColorRGB = function(e4) {
          return [e4.rgba >> 24 & 255, e4.rgba >> 16 & 255, e4.rgba >> 8 & 255];
        };
      }(a || (t2.color = a = {})), function(e3) {
        let t3, a2;
        try {
          const e4 = document.createElement("canvas");
          e4.width = 1, e4.height = 1;
          const i3 = e4.getContext("2d", { willReadFrequently: true });
          i3 && (t3 = i3, t3.globalCompositeOperation = "copy", a2 = t3.createLinearGradient(0, 0, 1, 1));
        } catch {}
        e3.toColor = function(e4) {
          if (e4.match(/#[\da-f]{3,8}/i))
            switch (e4.length) {
              case 4:
                return i2 = parseInt(e4.slice(1, 2).repeat(2), 16), s2 = parseInt(e4.slice(2, 3).repeat(2), 16), r = parseInt(e4.slice(3, 4).repeat(2), 16), o.toColor(i2, s2, r);
              case 5:
                return i2 = parseInt(e4.slice(1, 2).repeat(2), 16), s2 = parseInt(e4.slice(2, 3).repeat(2), 16), r = parseInt(e4.slice(3, 4).repeat(2), 16), n = parseInt(e4.slice(4, 5).repeat(2), 16), o.toColor(i2, s2, r, n);
              case 7:
                return { css: e4, rgba: (parseInt(e4.slice(1), 16) << 8 | 255) >>> 0 };
              case 9:
                return { css: e4, rgba: parseInt(e4.slice(1), 16) >>> 0 };
            }
          const h2 = e4.match(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(,\s*(0|1|\d?\.(\d+))\s*)?\)/);
          if (h2)
            return i2 = parseInt(h2[1]), s2 = parseInt(h2[2]), r = parseInt(h2[3]), n = Math.round(255 * (h2[5] === undefined ? 1 : parseFloat(h2[5]))), o.toColor(i2, s2, r, n);
          if (!t3 || !a2)
            throw new Error("css.toColor: Unsupported css format");
          if (t3.fillStyle = a2, t3.fillStyle = e4, typeof t3.fillStyle != "string")
            throw new Error("css.toColor: Unsupported css format");
          if (t3.fillRect(0, 0, 1, 1), [i2, s2, r, n] = t3.getImageData(0, 0, 1, 1).data, n !== 255)
            throw new Error("css.toColor: Unsupported css format");
          return { rgba: o.toRgba(i2, s2, r, n), css: e4 };
        };
      }(h || (t2.css = h = {})), function(e3) {
        function t3(e4, t4, i3) {
          const s3 = e4 / 255, r2 = t4 / 255, n2 = i3 / 255;
          return 0.2126 * (s3 <= 0.03928 ? s3 / 12.92 : Math.pow((s3 + 0.055) / 1.055, 2.4)) + 0.7152 * (r2 <= 0.03928 ? r2 / 12.92 : Math.pow((r2 + 0.055) / 1.055, 2.4)) + 0.0722 * (n2 <= 0.03928 ? n2 / 12.92 : Math.pow((n2 + 0.055) / 1.055, 2.4));
        }
        e3.relativeLuminance = function(e4) {
          return t3(e4 >> 16 & 255, e4 >> 8 & 255, 255 & e4);
        }, e3.relativeLuminance2 = t3;
      }(c || (t2.rgb = c = {})), function(e3) {
        function t3(e4, t4, i3) {
          const s3 = e4 >> 24 & 255, r2 = e4 >> 16 & 255, n2 = e4 >> 8 & 255;
          let o2 = t4 >> 24 & 255, a3 = t4 >> 16 & 255, h2 = t4 >> 8 & 255, l2 = _(c.relativeLuminance2(o2, a3, h2), c.relativeLuminance2(s3, r2, n2));
          for (;l2 < i3 && (o2 > 0 || a3 > 0 || h2 > 0); )
            o2 -= Math.max(0, Math.ceil(0.1 * o2)), a3 -= Math.max(0, Math.ceil(0.1 * a3)), h2 -= Math.max(0, Math.ceil(0.1 * h2)), l2 = _(c.relativeLuminance2(o2, a3, h2), c.relativeLuminance2(s3, r2, n2));
          return (o2 << 24 | a3 << 16 | h2 << 8 | 255) >>> 0;
        }
        function a2(e4, t4, i3) {
          const s3 = e4 >> 24 & 255, r2 = e4 >> 16 & 255, n2 = e4 >> 8 & 255;
          let o2 = t4 >> 24 & 255, a3 = t4 >> 16 & 255, h2 = t4 >> 8 & 255, l2 = _(c.relativeLuminance2(o2, a3, h2), c.relativeLuminance2(s3, r2, n2));
          for (;l2 < i3 && (o2 < 255 || a3 < 255 || h2 < 255); )
            o2 = Math.min(255, o2 + Math.ceil(0.1 * (255 - o2))), a3 = Math.min(255, a3 + Math.ceil(0.1 * (255 - a3))), h2 = Math.min(255, h2 + Math.ceil(0.1 * (255 - h2))), l2 = _(c.relativeLuminance2(o2, a3, h2), c.relativeLuminance2(s3, r2, n2));
          return (o2 << 24 | a3 << 16 | h2 << 8 | 255) >>> 0;
        }
        e3.blend = function(e4, t4) {
          if (n = (255 & t4) / 255, n === 1)
            return t4;
          const a3 = t4 >> 24 & 255, h2 = t4 >> 16 & 255, c2 = t4 >> 8 & 255, l2 = e4 >> 24 & 255, d2 = e4 >> 16 & 255, _2 = e4 >> 8 & 255;
          return i2 = l2 + Math.round((a3 - l2) * n), s2 = d2 + Math.round((h2 - d2) * n), r = _2 + Math.round((c2 - _2) * n), o.toRgba(i2, s2, r);
        }, e3.ensureContrastRatio = function(e4, i3, s3) {
          const r2 = c.relativeLuminance(e4 >> 8), n2 = c.relativeLuminance(i3 >> 8);
          if (_(r2, n2) < s3) {
            if (n2 < r2) {
              const n3 = t3(e4, i3, s3), o3 = _(r2, c.relativeLuminance(n3 >> 8));
              if (o3 < s3) {
                const t4 = a2(e4, i3, s3);
                return o3 > _(r2, c.relativeLuminance(t4 >> 8)) ? n3 : t4;
              }
              return n3;
            }
            const o2 = a2(e4, i3, s3), h2 = _(r2, c.relativeLuminance(o2 >> 8));
            if (h2 < s3) {
              const n3 = t3(e4, i3, s3);
              return h2 > _(r2, c.relativeLuminance(n3 >> 8)) ? o2 : n3;
            }
            return o2;
          }
        }, e3.reduceLuminance = t3, e3.increaseLuminance = a2, e3.toChannels = function(e4) {
          return [e4 >> 24 & 255, e4 >> 16 & 255, e4 >> 8 & 255, 255 & e4];
        };
      }(l || (t2.rgba = l = {})), t2.toPaddedHex = d, t2.contrastRatio = _;
    }, 8969: (e2, t2, i2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.CoreTerminal = undefined;
      const s2 = i2(844), r = i2(2585), n = i2(4348), o = i2(7866), a = i2(744), h = i2(7302), c = i2(6975), l = i2(8460), d = i2(1753), _ = i2(1480), u = i2(7994), f = i2(9282), v = i2(5435), p = i2(5981), g = i2(2660);
      let m = false;

      class S extends s2.Disposable {
        get onScroll() {
          return this._onScrollApi || (this._onScrollApi = this.register(new l.EventEmitter), this._onScroll.event((e3) => {
            this._onScrollApi?.fire(e3.position);
          })), this._onScrollApi.event;
        }
        get cols() {
          return this._bufferService.cols;
        }
        get rows() {
          return this._bufferService.rows;
        }
        get buffers() {
          return this._bufferService.buffers;
        }
        get options() {
          return this.optionsService.options;
        }
        set options(e3) {
          for (const t3 in e3)
            this.optionsService.options[t3] = e3[t3];
        }
        constructor(e3) {
          super(), this._windowsWrappingHeuristics = this.register(new s2.MutableDisposable), this._onBinary = this.register(new l.EventEmitter), this.onBinary = this._onBinary.event, this._onData = this.register(new l.EventEmitter), this.onData = this._onData.event, this._onLineFeed = this.register(new l.EventEmitter), this.onLineFeed = this._onLineFeed.event, this._onResize = this.register(new l.EventEmitter), this.onResize = this._onResize.event, this._onWriteParsed = this.register(new l.EventEmitter), this.onWriteParsed = this._onWriteParsed.event, this._onScroll = this.register(new l.EventEmitter), this._instantiationService = new n.InstantiationService, this.optionsService = this.register(new h.OptionsService(e3)), this._instantiationService.setService(r.IOptionsService, this.optionsService), this._bufferService = this.register(this._instantiationService.createInstance(a.BufferService)), this._instantiationService.setService(r.IBufferService, this._bufferService), this._logService = this.register(this._instantiationService.createInstance(o.LogService)), this._instantiationService.setService(r.ILogService, this._logService), this.coreService = this.register(this._instantiationService.createInstance(c.CoreService)), this._instantiationService.setService(r.ICoreService, this.coreService), this.coreMouseService = this.register(this._instantiationService.createInstance(d.CoreMouseService)), this._instantiationService.setService(r.ICoreMouseService, this.coreMouseService), this.unicodeService = this.register(this._instantiationService.createInstance(_.UnicodeService)), this._instantiationService.setService(r.IUnicodeService, this.unicodeService), this._charsetService = this._instantiationService.createInstance(u.CharsetService), this._instantiationService.setService(r.ICharsetService, this._charsetService), this._oscLinkService = this._instantiationService.createInstance(g.OscLinkService), this._instantiationService.setService(r.IOscLinkService, this._oscLinkService), this._inputHandler = this.register(new v.InputHandler(this._bufferService, this._charsetService, this.coreService, this._logService, this.optionsService, this._oscLinkService, this.coreMouseService, this.unicodeService)), this.register((0, l.forwardEvent)(this._inputHandler.onLineFeed, this._onLineFeed)), this.register(this._inputHandler), this.register((0, l.forwardEvent)(this._bufferService.onResize, this._onResize)), this.register((0, l.forwardEvent)(this.coreService.onData, this._onData)), this.register((0, l.forwardEvent)(this.coreService.onBinary, this._onBinary)), this.register(this.coreService.onRequestScrollToBottom(() => this.scrollToBottom())), this.register(this.coreService.onUserInput(() => this._writeBuffer.handleUserInput())), this.register(this.optionsService.onMultipleOptionChange(["windowsMode", "windowsPty"], () => this._handleWindowsPtyOptionChange())), this.register(this._bufferService.onScroll((e4) => {
            this._onScroll.fire({ position: this._bufferService.buffer.ydisp, source: 0 }), this._inputHandler.markRangeDirty(this._bufferService.buffer.scrollTop, this._bufferService.buffer.scrollBottom);
          })), this.register(this._inputHandler.onScroll((e4) => {
            this._onScroll.fire({ position: this._bufferService.buffer.ydisp, source: 0 }), this._inputHandler.markRangeDirty(this._bufferService.buffer.scrollTop, this._bufferService.buffer.scrollBottom);
          })), this._writeBuffer = this.register(new p.WriteBuffer((e4, t3) => this._inputHandler.parse(e4, t3))), this.register((0, l.forwardEvent)(this._writeBuffer.onWriteParsed, this._onWriteParsed));
        }
        write(e3, t3) {
          this._writeBuffer.write(e3, t3);
        }
        writeSync(e3, t3) {
          this._logService.logLevel <= r.LogLevelEnum.WARN && !m && (this._logService.warn("writeSync is unreliable and will be removed soon."), m = true), this._writeBuffer.writeSync(e3, t3);
        }
        input(e3, t3 = true) {
          this.coreService.triggerDataEvent(e3, t3);
        }
        resize(e3, t3) {
          isNaN(e3) || isNaN(t3) || (e3 = Math.max(e3, a.MINIMUM_COLS), t3 = Math.max(t3, a.MINIMUM_ROWS), this._bufferService.resize(e3, t3));
        }
        scroll(e3, t3 = false) {
          this._bufferService.scroll(e3, t3);
        }
        scrollLines(e3, t3, i3) {
          this._bufferService.scrollLines(e3, t3, i3);
        }
        scrollPages(e3) {
          this.scrollLines(e3 * (this.rows - 1));
        }
        scrollToTop() {
          this.scrollLines(-this._bufferService.buffer.ydisp);
        }
        scrollToBottom() {
          this.scrollLines(this._bufferService.buffer.ybase - this._bufferService.buffer.ydisp);
        }
        scrollToLine(e3) {
          const t3 = e3 - this._bufferService.buffer.ydisp;
          t3 !== 0 && this.scrollLines(t3);
        }
        registerEscHandler(e3, t3) {
          return this._inputHandler.registerEscHandler(e3, t3);
        }
        registerDcsHandler(e3, t3) {
          return this._inputHandler.registerDcsHandler(e3, t3);
        }
        registerCsiHandler(e3, t3) {
          return this._inputHandler.registerCsiHandler(e3, t3);
        }
        registerOscHandler(e3, t3) {
          return this._inputHandler.registerOscHandler(e3, t3);
        }
        _setup() {
          this._handleWindowsPtyOptionChange();
        }
        reset() {
          this._inputHandler.reset(), this._bufferService.reset(), this._charsetService.reset(), this.coreService.reset(), this.coreMouseService.reset();
        }
        _handleWindowsPtyOptionChange() {
          let e3 = false;
          const t3 = this.optionsService.rawOptions.windowsPty;
          t3 && t3.buildNumber !== undefined && t3.buildNumber !== undefined ? e3 = !!(t3.backend === "conpty" && t3.buildNumber < 21376) : this.optionsService.rawOptions.windowsMode && (e3 = true), e3 ? this._enableWindowsWrappingHeuristics() : this._windowsWrappingHeuristics.clear();
        }
        _enableWindowsWrappingHeuristics() {
          if (!this._windowsWrappingHeuristics.value) {
            const e3 = [];
            e3.push(this.onLineFeed(f.updateWindowsModeWrappedState.bind(null, this._bufferService))), e3.push(this.registerCsiHandler({ final: "H" }, () => ((0, f.updateWindowsModeWrappedState)(this._bufferService), false))), this._windowsWrappingHeuristics.value = (0, s2.toDisposable)(() => {
              for (const t3 of e3)
                t3.dispose();
            });
          }
        }
      }
      t2.CoreTerminal = S;
    }, 8460: (e2, t2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.runAndSubscribe = t2.forwardEvent = t2.EventEmitter = undefined, t2.EventEmitter = class {
        constructor() {
          this._listeners = [], this._disposed = false;
        }
        get event() {
          return this._event || (this._event = (e3) => (this._listeners.push(e3), { dispose: () => {
            if (!this._disposed) {
              for (let t3 = 0;t3 < this._listeners.length; t3++)
                if (this._listeners[t3] === e3)
                  return void this._listeners.splice(t3, 1);
            }
          } })), this._event;
        }
        fire(e3, t3) {
          const i2 = [];
          for (let e4 = 0;e4 < this._listeners.length; e4++)
            i2.push(this._listeners[e4]);
          for (let s2 = 0;s2 < i2.length; s2++)
            i2[s2].call(undefined, e3, t3);
        }
        dispose() {
          this.clearListeners(), this._disposed = true;
        }
        clearListeners() {
          this._listeners && (this._listeners.length = 0);
        }
      }, t2.forwardEvent = function(e3, t3) {
        return e3((e4) => t3.fire(e4));
      }, t2.runAndSubscribe = function(e3, t3) {
        return t3(undefined), e3((e4) => t3(e4));
      };
    }, 5435: function(e2, t2, i2) {
      var s2 = this && this.__decorate || function(e3, t3, i3, s3) {
        var r2, n2 = arguments.length, o2 = n2 < 3 ? t3 : s3 === null ? s3 = Object.getOwnPropertyDescriptor(t3, i3) : s3;
        if (typeof Reflect == "object" && typeof Reflect.decorate == "function")
          o2 = Reflect.decorate(e3, t3, i3, s3);
        else
          for (var a2 = e3.length - 1;a2 >= 0; a2--)
            (r2 = e3[a2]) && (o2 = (n2 < 3 ? r2(o2) : n2 > 3 ? r2(t3, i3, o2) : r2(t3, i3)) || o2);
        return n2 > 3 && o2 && Object.defineProperty(t3, i3, o2), o2;
      }, r = this && this.__param || function(e3, t3) {
        return function(i3, s3) {
          t3(i3, s3, e3);
        };
      };
      Object.defineProperty(t2, "__esModule", { value: true }), t2.InputHandler = t2.WindowsOptionsReportType = undefined;
      const n = i2(2584), o = i2(7116), a = i2(2015), h = i2(844), c = i2(482), l = i2(8437), d = i2(8460), _ = i2(643), u = i2(511), f = i2(3734), v = i2(2585), p = i2(1480), g = i2(6242), m = i2(6351), S = i2(5941), C = { "(": 0, ")": 1, "*": 2, "+": 3, "-": 1, ".": 2 }, b = 131072;
      function w(e3, t3) {
        if (e3 > 24)
          return t3.setWinLines || false;
        switch (e3) {
          case 1:
            return !!t3.restoreWin;
          case 2:
            return !!t3.minimizeWin;
          case 3:
            return !!t3.setWinPosition;
          case 4:
            return !!t3.setWinSizePixels;
          case 5:
            return !!t3.raiseWin;
          case 6:
            return !!t3.lowerWin;
          case 7:
            return !!t3.refreshWin;
          case 8:
            return !!t3.setWinSizeChars;
          case 9:
            return !!t3.maximizeWin;
          case 10:
            return !!t3.fullscreenWin;
          case 11:
            return !!t3.getWinState;
          case 13:
            return !!t3.getWinPosition;
          case 14:
            return !!t3.getWinSizePixels;
          case 15:
            return !!t3.getScreenSizePixels;
          case 16:
            return !!t3.getCellSizePixels;
          case 18:
            return !!t3.getWinSizeChars;
          case 19:
            return !!t3.getScreenSizeChars;
          case 20:
            return !!t3.getIconTitle;
          case 21:
            return !!t3.getWinTitle;
          case 22:
            return !!t3.pushTitle;
          case 23:
            return !!t3.popTitle;
          case 24:
            return !!t3.setWinLines;
        }
        return false;
      }
      var y;
      (function(e3) {
        e3[e3.GET_WIN_SIZE_PIXELS = 0] = "GET_WIN_SIZE_PIXELS", e3[e3.GET_CELL_SIZE_PIXELS = 1] = "GET_CELL_SIZE_PIXELS";
      })(y || (t2.WindowsOptionsReportType = y = {}));
      let E = 0;

      class k extends h.Disposable {
        getAttrData() {
          return this._curAttrData;
        }
        constructor(e3, t3, i3, s3, r2, h2, _2, f2, v2 = new a.EscapeSequenceParser) {
          super(), this._bufferService = e3, this._charsetService = t3, this._coreService = i3, this._logService = s3, this._optionsService = r2, this._oscLinkService = h2, this._coreMouseService = _2, this._unicodeService = f2, this._parser = v2, this._parseBuffer = new Uint32Array(4096), this._stringDecoder = new c.StringToUtf32, this._utf8Decoder = new c.Utf8ToUtf32, this._workCell = new u.CellData, this._windowTitle = "", this._iconName = "", this._windowTitleStack = [], this._iconNameStack = [], this._curAttrData = l.DEFAULT_ATTR_DATA.clone(), this._eraseAttrDataInternal = l.DEFAULT_ATTR_DATA.clone(), this._onRequestBell = this.register(new d.EventEmitter), this.onRequestBell = this._onRequestBell.event, this._onRequestRefreshRows = this.register(new d.EventEmitter), this.onRequestRefreshRows = this._onRequestRefreshRows.event, this._onRequestReset = this.register(new d.EventEmitter), this.onRequestReset = this._onRequestReset.event, this._onRequestSendFocus = this.register(new d.EventEmitter), this.onRequestSendFocus = this._onRequestSendFocus.event, this._onRequestSyncScrollBar = this.register(new d.EventEmitter), this.onRequestSyncScrollBar = this._onRequestSyncScrollBar.event, this._onRequestWindowsOptionsReport = this.register(new d.EventEmitter), this.onRequestWindowsOptionsReport = this._onRequestWindowsOptionsReport.event, this._onA11yChar = this.register(new d.EventEmitter), this.onA11yChar = this._onA11yChar.event, this._onA11yTab = this.register(new d.EventEmitter), this.onA11yTab = this._onA11yTab.event, this._onCursorMove = this.register(new d.EventEmitter), this.onCursorMove = this._onCursorMove.event, this._onLineFeed = this.register(new d.EventEmitter), this.onLineFeed = this._onLineFeed.event, this._onScroll = this.register(new d.EventEmitter), this.onScroll = this._onScroll.event, this._onTitleChange = this.register(new d.EventEmitter), this.onTitleChange = this._onTitleChange.event, this._onColor = this.register(new d.EventEmitter), this.onColor = this._onColor.event, this._parseStack = { paused: false, cursorStartX: 0, cursorStartY: 0, decodedLength: 0, position: 0 }, this._specialColors = [256, 257, 258], this.register(this._parser), this._dirtyRowTracker = new L(this._bufferService), this._activeBuffer = this._bufferService.buffer, this.register(this._bufferService.buffers.onBufferActivate((e4) => this._activeBuffer = e4.activeBuffer)), this._parser.setCsiHandlerFallback((e4, t4) => {
            this._logService.debug("Unknown CSI code: ", { identifier: this._parser.identToString(e4), params: t4.toArray() });
          }), this._parser.setEscHandlerFallback((e4) => {
            this._logService.debug("Unknown ESC code: ", { identifier: this._parser.identToString(e4) });
          }), this._parser.setExecuteHandlerFallback((e4) => {
            this._logService.debug("Unknown EXECUTE code: ", { code: e4 });
          }), this._parser.setOscHandlerFallback((e4, t4, i4) => {
            this._logService.debug("Unknown OSC code: ", { identifier: e4, action: t4, data: i4 });
          }), this._parser.setDcsHandlerFallback((e4, t4, i4) => {
            t4 === "HOOK" && (i4 = i4.toArray()), this._logService.debug("Unknown DCS code: ", { identifier: this._parser.identToString(e4), action: t4, payload: i4 });
          }), this._parser.setPrintHandler((e4, t4, i4) => this.print(e4, t4, i4)), this._parser.registerCsiHandler({ final: "@" }, (e4) => this.insertChars(e4)), this._parser.registerCsiHandler({ intermediates: " ", final: "@" }, (e4) => this.scrollLeft(e4)), this._parser.registerCsiHandler({ final: "A" }, (e4) => this.cursorUp(e4)), this._parser.registerCsiHandler({ intermediates: " ", final: "A" }, (e4) => this.scrollRight(e4)), this._parser.registerCsiHandler({ final: "B" }, (e4) => this.cursorDown(e4)), this._parser.registerCsiHandler({ final: "C" }, (e4) => this.cursorForward(e4)), this._parser.registerCsiHandler({ final: "D" }, (e4) => this.cursorBackward(e4)), this._parser.registerCsiHandler({ final: "E" }, (e4) => this.cursorNextLine(e4)), this._parser.registerCsiHandler({ final: "F" }, (e4) => this.cursorPrecedingLine(e4)), this._parser.registerCsiHandler({ final: "G" }, (e4) => this.cursorCharAbsolute(e4)), this._parser.registerCsiHandler({ final: "H" }, (e4) => this.cursorPosition(e4)), this._parser.registerCsiHandler({ final: "I" }, (e4) => this.cursorForwardTab(e4)), this._parser.registerCsiHandler({ final: "J" }, (e4) => this.eraseInDisplay(e4, false)), this._parser.registerCsiHandler({ prefix: "?", final: "J" }, (e4) => this.eraseInDisplay(e4, true)), this._parser.registerCsiHandler({ final: "K" }, (e4) => this.eraseInLine(e4, false)), this._parser.registerCsiHandler({ prefix: "?", final: "K" }, (e4) => this.eraseInLine(e4, true)), this._parser.registerCsiHandler({ final: "L" }, (e4) => this.insertLines(e4)), this._parser.registerCsiHandler({ final: "M" }, (e4) => this.deleteLines(e4)), this._parser.registerCsiHandler({ final: "P" }, (e4) => this.deleteChars(e4)), this._parser.registerCsiHandler({ final: "S" }, (e4) => this.scrollUp(e4)), this._parser.registerCsiHandler({ final: "T" }, (e4) => this.scrollDown(e4)), this._parser.registerCsiHandler({ final: "X" }, (e4) => this.eraseChars(e4)), this._parser.registerCsiHandler({ final: "Z" }, (e4) => this.cursorBackwardTab(e4)), this._parser.registerCsiHandler({ final: "`" }, (e4) => this.charPosAbsolute(e4)), this._parser.registerCsiHandler({ final: "a" }, (e4) => this.hPositionRelative(e4)), this._parser.registerCsiHandler({ final: "b" }, (e4) => this.repeatPrecedingCharacter(e4)), this._parser.registerCsiHandler({ final: "c" }, (e4) => this.sendDeviceAttributesPrimary(e4)), this._parser.registerCsiHandler({ prefix: ">", final: "c" }, (e4) => this.sendDeviceAttributesSecondary(e4)), this._parser.registerCsiHandler({ final: "d" }, (e4) => this.linePosAbsolute(e4)), this._parser.registerCsiHandler({ final: "e" }, (e4) => this.vPositionRelative(e4)), this._parser.registerCsiHandler({ final: "f" }, (e4) => this.hVPosition(e4)), this._parser.registerCsiHandler({ final: "g" }, (e4) => this.tabClear(e4)), this._parser.registerCsiHandler({ final: "h" }, (e4) => this.setMode(e4)), this._parser.registerCsiHandler({ prefix: "?", final: "h" }, (e4) => this.setModePrivate(e4)), this._parser.registerCsiHandler({ final: "l" }, (e4) => this.resetMode(e4)), this._parser.registerCsiHandler({ prefix: "?", final: "l" }, (e4) => this.resetModePrivate(e4)), this._parser.registerCsiHandler({ final: "m" }, (e4) => this.charAttributes(e4)), this._parser.registerCsiHandler({ final: "n" }, (e4) => this.deviceStatus(e4)), this._parser.registerCsiHandler({ prefix: "?", final: "n" }, (e4) => this.deviceStatusPrivate(e4)), this._parser.registerCsiHandler({ intermediates: "!", final: "p" }, (e4) => this.softReset(e4)), this._parser.registerCsiHandler({ intermediates: " ", final: "q" }, (e4) => this.setCursorStyle(e4)), this._parser.registerCsiHandler({ final: "r" }, (e4) => this.setScrollRegion(e4)), this._parser.registerCsiHandler({ final: "s" }, (e4) => this.saveCursor(e4)), this._parser.registerCsiHandler({ final: "t" }, (e4) => this.windowOptions(e4)), this._parser.registerCsiHandler({ final: "u" }, (e4) => this.restoreCursor(e4)), this._parser.registerCsiHandler({ intermediates: "'", final: "}" }, (e4) => this.insertColumns(e4)), this._parser.registerCsiHandler({ intermediates: "'", final: "~" }, (e4) => this.deleteColumns(e4)), this._parser.registerCsiHandler({ intermediates: '"', final: "q" }, (e4) => this.selectProtected(e4)), this._parser.registerCsiHandler({ intermediates: "$", final: "p" }, (e4) => this.requestMode(e4, true)), this._parser.registerCsiHandler({ prefix: "?", intermediates: "$", final: "p" }, (e4) => this.requestMode(e4, false)), this._parser.setExecuteHandler(n.C0.BEL, () => this.bell()), this._parser.setExecuteHandler(n.C0.LF, () => this.lineFeed()), this._parser.setExecuteHandler(n.C0.VT, () => this.lineFeed()), this._parser.setExecuteHandler(n.C0.FF, () => this.lineFeed()), this._parser.setExecuteHandler(n.C0.CR, () => this.carriageReturn()), this._parser.setExecuteHandler(n.C0.BS, () => this.backspace()), this._parser.setExecuteHandler(n.C0.HT, () => this.tab()), this._parser.setExecuteHandler(n.C0.SO, () => this.shiftOut()), this._parser.setExecuteHandler(n.C0.SI, () => this.shiftIn()), this._parser.setExecuteHandler(n.C1.IND, () => this.index()), this._parser.setExecuteHandler(n.C1.NEL, () => this.nextLine()), this._parser.setExecuteHandler(n.C1.HTS, () => this.tabSet()), this._parser.registerOscHandler(0, new g.OscHandler((e4) => (this.setTitle(e4), this.setIconName(e4), true))), this._parser.registerOscHandler(1, new g.OscHandler((e4) => this.setIconName(e4))), this._parser.registerOscHandler(2, new g.OscHandler((e4) => this.setTitle(e4))), this._parser.registerOscHandler(4, new g.OscHandler((e4) => this.setOrReportIndexedColor(e4))), this._parser.registerOscHandler(8, new g.OscHandler((e4) => this.setHyperlink(e4))), this._parser.registerOscHandler(10, new g.OscHandler((e4) => this.setOrReportFgColor(e4))), this._parser.registerOscHandler(11, new g.OscHandler((e4) => this.setOrReportBgColor(e4))), this._parser.registerOscHandler(12, new g.OscHandler((e4) => this.setOrReportCursorColor(e4))), this._parser.registerOscHandler(104, new g.OscHandler((e4) => this.restoreIndexedColor(e4))), this._parser.registerOscHandler(110, new g.OscHandler((e4) => this.restoreFgColor(e4))), this._parser.registerOscHandler(111, new g.OscHandler((e4) => this.restoreBgColor(e4))), this._parser.registerOscHandler(112, new g.OscHandler((e4) => this.restoreCursorColor(e4))), this._parser.registerEscHandler({ final: "7" }, () => this.saveCursor()), this._parser.registerEscHandler({ final: "8" }, () => this.restoreCursor()), this._parser.registerEscHandler({ final: "D" }, () => this.index()), this._parser.registerEscHandler({ final: "E" }, () => this.nextLine()), this._parser.registerEscHandler({ final: "H" }, () => this.tabSet()), this._parser.registerEscHandler({ final: "M" }, () => this.reverseIndex()), this._parser.registerEscHandler({ final: "=" }, () => this.keypadApplicationMode()), this._parser.registerEscHandler({ final: ">" }, () => this.keypadNumericMode()), this._parser.registerEscHandler({ final: "c" }, () => this.fullReset()), this._parser.registerEscHandler({ final: "n" }, () => this.setgLevel(2)), this._parser.registerEscHandler({ final: "o" }, () => this.setgLevel(3)), this._parser.registerEscHandler({ final: "|" }, () => this.setgLevel(3)), this._parser.registerEscHandler({ final: "}" }, () => this.setgLevel(2)), this._parser.registerEscHandler({ final: "~" }, () => this.setgLevel(1)), this._parser.registerEscHandler({ intermediates: "%", final: "@" }, () => this.selectDefaultCharset()), this._parser.registerEscHandler({ intermediates: "%", final: "G" }, () => this.selectDefaultCharset());
          for (const e4 in o.CHARSETS)
            this._parser.registerEscHandler({ intermediates: "(", final: e4 }, () => this.selectCharset("(" + e4)), this._parser.registerEscHandler({ intermediates: ")", final: e4 }, () => this.selectCharset(")" + e4)), this._parser.registerEscHandler({ intermediates: "*", final: e4 }, () => this.selectCharset("*" + e4)), this._parser.registerEscHandler({ intermediates: "+", final: e4 }, () => this.selectCharset("+" + e4)), this._parser.registerEscHandler({ intermediates: "-", final: e4 }, () => this.selectCharset("-" + e4)), this._parser.registerEscHandler({ intermediates: ".", final: e4 }, () => this.selectCharset("." + e4)), this._parser.registerEscHandler({ intermediates: "/", final: e4 }, () => this.selectCharset("/" + e4));
          this._parser.registerEscHandler({ intermediates: "#", final: "8" }, () => this.screenAlignmentPattern()), this._parser.setErrorHandler((e4) => (this._logService.error("Parsing error: ", e4), e4)), this._parser.registerDcsHandler({ intermediates: "$", final: "q" }, new m.DcsHandler((e4, t4) => this.requestStatusString(e4, t4)));
        }
        _preserveStack(e3, t3, i3, s3) {
          this._parseStack.paused = true, this._parseStack.cursorStartX = e3, this._parseStack.cursorStartY = t3, this._parseStack.decodedLength = i3, this._parseStack.position = s3;
        }
        _logSlowResolvingAsync(e3) {
          this._logService.logLevel <= v.LogLevelEnum.WARN && Promise.race([e3, new Promise((e4, t3) => setTimeout(() => t3("#SLOW_TIMEOUT"), 5000))]).catch((e4) => {
            if (e4 !== "#SLOW_TIMEOUT")
              throw e4;
            console.warn("async parser handler taking longer than 5000 ms");
          });
        }
        _getCurrentLinkId() {
          return this._curAttrData.extended.urlId;
        }
        parse(e3, t3) {
          let i3, s3 = this._activeBuffer.x, r2 = this._activeBuffer.y, n2 = 0;
          const o2 = this._parseStack.paused;
          if (o2) {
            if (i3 = this._parser.parse(this._parseBuffer, this._parseStack.decodedLength, t3))
              return this._logSlowResolvingAsync(i3), i3;
            s3 = this._parseStack.cursorStartX, r2 = this._parseStack.cursorStartY, this._parseStack.paused = false, e3.length > b && (n2 = this._parseStack.position + b);
          }
          if (this._logService.logLevel <= v.LogLevelEnum.DEBUG && this._logService.debug("parsing data" + (typeof e3 == "string" ? ` "${e3}"` : ` "${Array.prototype.map.call(e3, (e4) => String.fromCharCode(e4)).join("")}"`), typeof e3 == "string" ? e3.split("").map((e4) => e4.charCodeAt(0)) : e3), this._parseBuffer.length < e3.length && this._parseBuffer.length < b && (this._parseBuffer = new Uint32Array(Math.min(e3.length, b))), o2 || this._dirtyRowTracker.clearRange(), e3.length > b)
            for (let t4 = n2;t4 < e3.length; t4 += b) {
              const n3 = t4 + b < e3.length ? t4 + b : e3.length, o3 = typeof e3 == "string" ? this._stringDecoder.decode(e3.substring(t4, n3), this._parseBuffer) : this._utf8Decoder.decode(e3.subarray(t4, n3), this._parseBuffer);
              if (i3 = this._parser.parse(this._parseBuffer, o3))
                return this._preserveStack(s3, r2, o3, t4), this._logSlowResolvingAsync(i3), i3;
            }
          else if (!o2) {
            const t4 = typeof e3 == "string" ? this._stringDecoder.decode(e3, this._parseBuffer) : this._utf8Decoder.decode(e3, this._parseBuffer);
            if (i3 = this._parser.parse(this._parseBuffer, t4))
              return this._preserveStack(s3, r2, t4, 0), this._logSlowResolvingAsync(i3), i3;
          }
          this._activeBuffer.x === s3 && this._activeBuffer.y === r2 || this._onCursorMove.fire();
          const a2 = this._dirtyRowTracker.end + (this._bufferService.buffer.ybase - this._bufferService.buffer.ydisp), h2 = this._dirtyRowTracker.start + (this._bufferService.buffer.ybase - this._bufferService.buffer.ydisp);
          h2 < this._bufferService.rows && this._onRequestRefreshRows.fire(Math.min(h2, this._bufferService.rows - 1), Math.min(a2, this._bufferService.rows - 1));
        }
        print(e3, t3, i3) {
          let s3, r2;
          const n2 = this._charsetService.charset, o2 = this._optionsService.rawOptions.screenReaderMode, a2 = this._bufferService.cols, h2 = this._coreService.decPrivateModes.wraparound, d2 = this._coreService.modes.insertMode, u2 = this._curAttrData;
          let f2 = this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y);
          this._dirtyRowTracker.markDirty(this._activeBuffer.y), this._activeBuffer.x && i3 - t3 > 0 && f2.getWidth(this._activeBuffer.x - 1) === 2 && f2.setCellFromCodepoint(this._activeBuffer.x - 1, 0, 1, u2);
          let v2 = this._parser.precedingJoinState;
          for (let g2 = t3;g2 < i3; ++g2) {
            if (s3 = e3[g2], s3 < 127 && n2) {
              const e4 = n2[String.fromCharCode(s3)];
              e4 && (s3 = e4.charCodeAt(0));
            }
            const t4 = this._unicodeService.charProperties(s3, v2);
            r2 = p.UnicodeService.extractWidth(t4);
            const i4 = p.UnicodeService.extractShouldJoin(t4), m2 = i4 ? p.UnicodeService.extractWidth(v2) : 0;
            if (v2 = t4, o2 && this._onA11yChar.fire((0, c.stringFromCodePoint)(s3)), this._getCurrentLinkId() && this._oscLinkService.addLineToLink(this._getCurrentLinkId(), this._activeBuffer.ybase + this._activeBuffer.y), this._activeBuffer.x + r2 - m2 > a2) {
              if (h2) {
                const e4 = f2;
                let t5 = this._activeBuffer.x - m2;
                for (this._activeBuffer.x = m2, this._activeBuffer.y++, this._activeBuffer.y === this._activeBuffer.scrollBottom + 1 ? (this._activeBuffer.y--, this._bufferService.scroll(this._eraseAttrData(), true)) : (this._activeBuffer.y >= this._bufferService.rows && (this._activeBuffer.y = this._bufferService.rows - 1), this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y).isWrapped = true), f2 = this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y), m2 > 0 && f2 instanceof l.BufferLine && f2.copyCellsFrom(e4, t5, 0, m2, false);t5 < a2; )
                  e4.setCellFromCodepoint(t5++, 0, 1, u2);
              } else if (this._activeBuffer.x = a2 - 1, r2 === 2)
                continue;
            }
            if (i4 && this._activeBuffer.x) {
              const e4 = f2.getWidth(this._activeBuffer.x - 1) ? 1 : 2;
              f2.addCodepointToCell(this._activeBuffer.x - e4, s3, r2);
              for (let e5 = r2 - m2;--e5 >= 0; )
                f2.setCellFromCodepoint(this._activeBuffer.x++, 0, 0, u2);
            } else if (d2 && (f2.insertCells(this._activeBuffer.x, r2 - m2, this._activeBuffer.getNullCell(u2)), f2.getWidth(a2 - 1) === 2 && f2.setCellFromCodepoint(a2 - 1, _.NULL_CELL_CODE, _.NULL_CELL_WIDTH, u2)), f2.setCellFromCodepoint(this._activeBuffer.x++, s3, r2, u2), r2 > 0)
              for (;--r2; )
                f2.setCellFromCodepoint(this._activeBuffer.x++, 0, 0, u2);
          }
          this._parser.precedingJoinState = v2, this._activeBuffer.x < a2 && i3 - t3 > 0 && f2.getWidth(this._activeBuffer.x) === 0 && !f2.hasContent(this._activeBuffer.x) && f2.setCellFromCodepoint(this._activeBuffer.x, 0, 1, u2), this._dirtyRowTracker.markDirty(this._activeBuffer.y);
        }
        registerCsiHandler(e3, t3) {
          return e3.final !== "t" || e3.prefix || e3.intermediates ? this._parser.registerCsiHandler(e3, t3) : this._parser.registerCsiHandler(e3, (e4) => !w(e4.params[0], this._optionsService.rawOptions.windowOptions) || t3(e4));
        }
        registerDcsHandler(e3, t3) {
          return this._parser.registerDcsHandler(e3, new m.DcsHandler(t3));
        }
        registerEscHandler(e3, t3) {
          return this._parser.registerEscHandler(e3, t3);
        }
        registerOscHandler(e3, t3) {
          return this._parser.registerOscHandler(e3, new g.OscHandler(t3));
        }
        bell() {
          return this._onRequestBell.fire(), true;
        }
        lineFeed() {
          return this._dirtyRowTracker.markDirty(this._activeBuffer.y), this._optionsService.rawOptions.convertEol && (this._activeBuffer.x = 0), this._activeBuffer.y++, this._activeBuffer.y === this._activeBuffer.scrollBottom + 1 ? (this._activeBuffer.y--, this._bufferService.scroll(this._eraseAttrData())) : this._activeBuffer.y >= this._bufferService.rows ? this._activeBuffer.y = this._bufferService.rows - 1 : this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y).isWrapped = false, this._activeBuffer.x >= this._bufferService.cols && this._activeBuffer.x--, this._dirtyRowTracker.markDirty(this._activeBuffer.y), this._onLineFeed.fire(), true;
        }
        carriageReturn() {
          return this._activeBuffer.x = 0, true;
        }
        backspace() {
          if (!this._coreService.decPrivateModes.reverseWraparound)
            return this._restrictCursor(), this._activeBuffer.x > 0 && this._activeBuffer.x--, true;
          if (this._restrictCursor(this._bufferService.cols), this._activeBuffer.x > 0)
            this._activeBuffer.x--;
          else if (this._activeBuffer.x === 0 && this._activeBuffer.y > this._activeBuffer.scrollTop && this._activeBuffer.y <= this._activeBuffer.scrollBottom && this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y)?.isWrapped) {
            this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y).isWrapped = false, this._activeBuffer.y--, this._activeBuffer.x = this._bufferService.cols - 1;
            const e3 = this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y);
            e3.hasWidth(this._activeBuffer.x) && !e3.hasContent(this._activeBuffer.x) && this._activeBuffer.x--;
          }
          return this._restrictCursor(), true;
        }
        tab() {
          if (this._activeBuffer.x >= this._bufferService.cols)
            return true;
          const e3 = this._activeBuffer.x;
          return this._activeBuffer.x = this._activeBuffer.nextStop(), this._optionsService.rawOptions.screenReaderMode && this._onA11yTab.fire(this._activeBuffer.x - e3), true;
        }
        shiftOut() {
          return this._charsetService.setgLevel(1), true;
        }
        shiftIn() {
          return this._charsetService.setgLevel(0), true;
        }
        _restrictCursor(e3 = this._bufferService.cols - 1) {
          this._activeBuffer.x = Math.min(e3, Math.max(0, this._activeBuffer.x)), this._activeBuffer.y = this._coreService.decPrivateModes.origin ? Math.min(this._activeBuffer.scrollBottom, Math.max(this._activeBuffer.scrollTop, this._activeBuffer.y)) : Math.min(this._bufferService.rows - 1, Math.max(0, this._activeBuffer.y)), this._dirtyRowTracker.markDirty(this._activeBuffer.y);
        }
        _setCursor(e3, t3) {
          this._dirtyRowTracker.markDirty(this._activeBuffer.y), this._coreService.decPrivateModes.origin ? (this._activeBuffer.x = e3, this._activeBuffer.y = this._activeBuffer.scrollTop + t3) : (this._activeBuffer.x = e3, this._activeBuffer.y = t3), this._restrictCursor(), this._dirtyRowTracker.markDirty(this._activeBuffer.y);
        }
        _moveCursor(e3, t3) {
          this._restrictCursor(), this._setCursor(this._activeBuffer.x + e3, this._activeBuffer.y + t3);
        }
        cursorUp(e3) {
          const t3 = this._activeBuffer.y - this._activeBuffer.scrollTop;
          return t3 >= 0 ? this._moveCursor(0, -Math.min(t3, e3.params[0] || 1)) : this._moveCursor(0, -(e3.params[0] || 1)), true;
        }
        cursorDown(e3) {
          const t3 = this._activeBuffer.scrollBottom - this._activeBuffer.y;
          return t3 >= 0 ? this._moveCursor(0, Math.min(t3, e3.params[0] || 1)) : this._moveCursor(0, e3.params[0] || 1), true;
        }
        cursorForward(e3) {
          return this._moveCursor(e3.params[0] || 1, 0), true;
        }
        cursorBackward(e3) {
          return this._moveCursor(-(e3.params[0] || 1), 0), true;
        }
        cursorNextLine(e3) {
          return this.cursorDown(e3), this._activeBuffer.x = 0, true;
        }
        cursorPrecedingLine(e3) {
          return this.cursorUp(e3), this._activeBuffer.x = 0, true;
        }
        cursorCharAbsolute(e3) {
          return this._setCursor((e3.params[0] || 1) - 1, this._activeBuffer.y), true;
        }
        cursorPosition(e3) {
          return this._setCursor(e3.length >= 2 ? (e3.params[1] || 1) - 1 : 0, (e3.params[0] || 1) - 1), true;
        }
        charPosAbsolute(e3) {
          return this._setCursor((e3.params[0] || 1) - 1, this._activeBuffer.y), true;
        }
        hPositionRelative(e3) {
          return this._moveCursor(e3.params[0] || 1, 0), true;
        }
        linePosAbsolute(e3) {
          return this._setCursor(this._activeBuffer.x, (e3.params[0] || 1) - 1), true;
        }
        vPositionRelative(e3) {
          return this._moveCursor(0, e3.params[0] || 1), true;
        }
        hVPosition(e3) {
          return this.cursorPosition(e3), true;
        }
        tabClear(e3) {
          const t3 = e3.params[0];
          return t3 === 0 ? delete this._activeBuffer.tabs[this._activeBuffer.x] : t3 === 3 && (this._activeBuffer.tabs = {}), true;
        }
        cursorForwardTab(e3) {
          if (this._activeBuffer.x >= this._bufferService.cols)
            return true;
          let t3 = e3.params[0] || 1;
          for (;t3--; )
            this._activeBuffer.x = this._activeBuffer.nextStop();
          return true;
        }
        cursorBackwardTab(e3) {
          if (this._activeBuffer.x >= this._bufferService.cols)
            return true;
          let t3 = e3.params[0] || 1;
          for (;t3--; )
            this._activeBuffer.x = this._activeBuffer.prevStop();
          return true;
        }
        selectProtected(e3) {
          const t3 = e3.params[0];
          return t3 === 1 && (this._curAttrData.bg |= 536870912), t3 !== 2 && t3 !== 0 || (this._curAttrData.bg &= -536870913), true;
        }
        _eraseInBufferLine(e3, t3, i3, s3 = false, r2 = false) {
          const n2 = this._activeBuffer.lines.get(this._activeBuffer.ybase + e3);
          n2.replaceCells(t3, i3, this._activeBuffer.getNullCell(this._eraseAttrData()), r2), s3 && (n2.isWrapped = false);
        }
        _resetBufferLine(e3, t3 = false) {
          const i3 = this._activeBuffer.lines.get(this._activeBuffer.ybase + e3);
          i3 && (i3.fill(this._activeBuffer.getNullCell(this._eraseAttrData()), t3), this._bufferService.buffer.clearMarkers(this._activeBuffer.ybase + e3), i3.isWrapped = false);
        }
        eraseInDisplay(e3, t3 = false) {
          let i3;
          switch (this._restrictCursor(this._bufferService.cols), e3.params[0]) {
            case 0:
              for (i3 = this._activeBuffer.y, this._dirtyRowTracker.markDirty(i3), this._eraseInBufferLine(i3++, this._activeBuffer.x, this._bufferService.cols, this._activeBuffer.x === 0, t3);i3 < this._bufferService.rows; i3++)
                this._resetBufferLine(i3, t3);
              this._dirtyRowTracker.markDirty(i3);
              break;
            case 1:
              for (i3 = this._activeBuffer.y, this._dirtyRowTracker.markDirty(i3), this._eraseInBufferLine(i3, 0, this._activeBuffer.x + 1, true, t3), this._activeBuffer.x + 1 >= this._bufferService.cols && (this._activeBuffer.lines.get(i3 + 1).isWrapped = false);i3--; )
                this._resetBufferLine(i3, t3);
              this._dirtyRowTracker.markDirty(0);
              break;
            case 2:
              for (i3 = this._bufferService.rows, this._dirtyRowTracker.markDirty(i3 - 1);i3--; )
                this._resetBufferLine(i3, t3);
              this._dirtyRowTracker.markDirty(0);
              break;
            case 3:
              const e4 = this._activeBuffer.lines.length - this._bufferService.rows;
              e4 > 0 && (this._activeBuffer.lines.trimStart(e4), this._activeBuffer.ybase = Math.max(this._activeBuffer.ybase - e4, 0), this._activeBuffer.ydisp = Math.max(this._activeBuffer.ydisp - e4, 0), this._onScroll.fire(0));
          }
          return true;
        }
        eraseInLine(e3, t3 = false) {
          switch (this._restrictCursor(this._bufferService.cols), e3.params[0]) {
            case 0:
              this._eraseInBufferLine(this._activeBuffer.y, this._activeBuffer.x, this._bufferService.cols, this._activeBuffer.x === 0, t3);
              break;
            case 1:
              this._eraseInBufferLine(this._activeBuffer.y, 0, this._activeBuffer.x + 1, false, t3);
              break;
            case 2:
              this._eraseInBufferLine(this._activeBuffer.y, 0, this._bufferService.cols, true, t3);
          }
          return this._dirtyRowTracker.markDirty(this._activeBuffer.y), true;
        }
        insertLines(e3) {
          this._restrictCursor();
          let t3 = e3.params[0] || 1;
          if (this._activeBuffer.y > this._activeBuffer.scrollBottom || this._activeBuffer.y < this._activeBuffer.scrollTop)
            return true;
          const i3 = this._activeBuffer.ybase + this._activeBuffer.y, s3 = this._bufferService.rows - 1 - this._activeBuffer.scrollBottom, r2 = this._bufferService.rows - 1 + this._activeBuffer.ybase - s3 + 1;
          for (;t3--; )
            this._activeBuffer.lines.splice(r2 - 1, 1), this._activeBuffer.lines.splice(i3, 0, this._activeBuffer.getBlankLine(this._eraseAttrData()));
          return this._dirtyRowTracker.markRangeDirty(this._activeBuffer.y, this._activeBuffer.scrollBottom), this._activeBuffer.x = 0, true;
        }
        deleteLines(e3) {
          this._restrictCursor();
          let t3 = e3.params[0] || 1;
          if (this._activeBuffer.y > this._activeBuffer.scrollBottom || this._activeBuffer.y < this._activeBuffer.scrollTop)
            return true;
          const i3 = this._activeBuffer.ybase + this._activeBuffer.y;
          let s3;
          for (s3 = this._bufferService.rows - 1 - this._activeBuffer.scrollBottom, s3 = this._bufferService.rows - 1 + this._activeBuffer.ybase - s3;t3--; )
            this._activeBuffer.lines.splice(i3, 1), this._activeBuffer.lines.splice(s3, 0, this._activeBuffer.getBlankLine(this._eraseAttrData()));
          return this._dirtyRowTracker.markRangeDirty(this._activeBuffer.y, this._activeBuffer.scrollBottom), this._activeBuffer.x = 0, true;
        }
        insertChars(e3) {
          this._restrictCursor();
          const t3 = this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y);
          return t3 && (t3.insertCells(this._activeBuffer.x, e3.params[0] || 1, this._activeBuffer.getNullCell(this._eraseAttrData())), this._dirtyRowTracker.markDirty(this._activeBuffer.y)), true;
        }
        deleteChars(e3) {
          this._restrictCursor();
          const t3 = this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y);
          return t3 && (t3.deleteCells(this._activeBuffer.x, e3.params[0] || 1, this._activeBuffer.getNullCell(this._eraseAttrData())), this._dirtyRowTracker.markDirty(this._activeBuffer.y)), true;
        }
        scrollUp(e3) {
          let t3 = e3.params[0] || 1;
          for (;t3--; )
            this._activeBuffer.lines.splice(this._activeBuffer.ybase + this._activeBuffer.scrollTop, 1), this._activeBuffer.lines.splice(this._activeBuffer.ybase + this._activeBuffer.scrollBottom, 0, this._activeBuffer.getBlankLine(this._eraseAttrData()));
          return this._dirtyRowTracker.markRangeDirty(this._activeBuffer.scrollTop, this._activeBuffer.scrollBottom), true;
        }
        scrollDown(e3) {
          let t3 = e3.params[0] || 1;
          for (;t3--; )
            this._activeBuffer.lines.splice(this._activeBuffer.ybase + this._activeBuffer.scrollBottom, 1), this._activeBuffer.lines.splice(this._activeBuffer.ybase + this._activeBuffer.scrollTop, 0, this._activeBuffer.getBlankLine(l.DEFAULT_ATTR_DATA));
          return this._dirtyRowTracker.markRangeDirty(this._activeBuffer.scrollTop, this._activeBuffer.scrollBottom), true;
        }
        scrollLeft(e3) {
          if (this._activeBuffer.y > this._activeBuffer.scrollBottom || this._activeBuffer.y < this._activeBuffer.scrollTop)
            return true;
          const t3 = e3.params[0] || 1;
          for (let e4 = this._activeBuffer.scrollTop;e4 <= this._activeBuffer.scrollBottom; ++e4) {
            const i3 = this._activeBuffer.lines.get(this._activeBuffer.ybase + e4);
            i3.deleteCells(0, t3, this._activeBuffer.getNullCell(this._eraseAttrData())), i3.isWrapped = false;
          }
          return this._dirtyRowTracker.markRangeDirty(this._activeBuffer.scrollTop, this._activeBuffer.scrollBottom), true;
        }
        scrollRight(e3) {
          if (this._activeBuffer.y > this._activeBuffer.scrollBottom || this._activeBuffer.y < this._activeBuffer.scrollTop)
            return true;
          const t3 = e3.params[0] || 1;
          for (let e4 = this._activeBuffer.scrollTop;e4 <= this._activeBuffer.scrollBottom; ++e4) {
            const i3 = this._activeBuffer.lines.get(this._activeBuffer.ybase + e4);
            i3.insertCells(0, t3, this._activeBuffer.getNullCell(this._eraseAttrData())), i3.isWrapped = false;
          }
          return this._dirtyRowTracker.markRangeDirty(this._activeBuffer.scrollTop, this._activeBuffer.scrollBottom), true;
        }
        insertColumns(e3) {
          if (this._activeBuffer.y > this._activeBuffer.scrollBottom || this._activeBuffer.y < this._activeBuffer.scrollTop)
            return true;
          const t3 = e3.params[0] || 1;
          for (let e4 = this._activeBuffer.scrollTop;e4 <= this._activeBuffer.scrollBottom; ++e4) {
            const i3 = this._activeBuffer.lines.get(this._activeBuffer.ybase + e4);
            i3.insertCells(this._activeBuffer.x, t3, this._activeBuffer.getNullCell(this._eraseAttrData())), i3.isWrapped = false;
          }
          return this._dirtyRowTracker.markRangeDirty(this._activeBuffer.scrollTop, this._activeBuffer.scrollBottom), true;
        }
        deleteColumns(e3) {
          if (this._activeBuffer.y > this._activeBuffer.scrollBottom || this._activeBuffer.y < this._activeBuffer.scrollTop)
            return true;
          const t3 = e3.params[0] || 1;
          for (let e4 = this._activeBuffer.scrollTop;e4 <= this._activeBuffer.scrollBottom; ++e4) {
            const i3 = this._activeBuffer.lines.get(this._activeBuffer.ybase + e4);
            i3.deleteCells(this._activeBuffer.x, t3, this._activeBuffer.getNullCell(this._eraseAttrData())), i3.isWrapped = false;
          }
          return this._dirtyRowTracker.markRangeDirty(this._activeBuffer.scrollTop, this._activeBuffer.scrollBottom), true;
        }
        eraseChars(e3) {
          this._restrictCursor();
          const t3 = this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y);
          return t3 && (t3.replaceCells(this._activeBuffer.x, this._activeBuffer.x + (e3.params[0] || 1), this._activeBuffer.getNullCell(this._eraseAttrData())), this._dirtyRowTracker.markDirty(this._activeBuffer.y)), true;
        }
        repeatPrecedingCharacter(e3) {
          const t3 = this._parser.precedingJoinState;
          if (!t3)
            return true;
          const i3 = e3.params[0] || 1, s3 = p.UnicodeService.extractWidth(t3), r2 = this._activeBuffer.x - s3, n2 = this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y).getString(r2), o2 = new Uint32Array(n2.length * i3);
          let a2 = 0;
          for (let e4 = 0;e4 < n2.length; ) {
            const t4 = n2.codePointAt(e4) || 0;
            o2[a2++] = t4, e4 += t4 > 65535 ? 2 : 1;
          }
          let h2 = a2;
          for (let e4 = 1;e4 < i3; ++e4)
            o2.copyWithin(h2, 0, a2), h2 += a2;
          return this.print(o2, 0, h2), true;
        }
        sendDeviceAttributesPrimary(e3) {
          return e3.params[0] > 0 || (this._is("xterm") || this._is("rxvt-unicode") || this._is("screen") ? this._coreService.triggerDataEvent(n.C0.ESC + "[?1;2c") : this._is("linux") && this._coreService.triggerDataEvent(n.C0.ESC + "[?6c")), true;
        }
        sendDeviceAttributesSecondary(e3) {
          return e3.params[0] > 0 || (this._is("xterm") ? this._coreService.triggerDataEvent(n.C0.ESC + "[>0;276;0c") : this._is("rxvt-unicode") ? this._coreService.triggerDataEvent(n.C0.ESC + "[>85;95;0c") : this._is("linux") ? this._coreService.triggerDataEvent(e3.params[0] + "c") : this._is("screen") && this._coreService.triggerDataEvent(n.C0.ESC + "[>83;40003;0c")), true;
        }
        _is(e3) {
          return (this._optionsService.rawOptions.termName + "").indexOf(e3) === 0;
        }
        setMode(e3) {
          for (let t3 = 0;t3 < e3.length; t3++)
            switch (e3.params[t3]) {
              case 4:
                this._coreService.modes.insertMode = true;
                break;
              case 20:
                this._optionsService.options.convertEol = true;
            }
          return true;
        }
        setModePrivate(e3) {
          for (let t3 = 0;t3 < e3.length; t3++)
            switch (e3.params[t3]) {
              case 1:
                this._coreService.decPrivateModes.applicationCursorKeys = true;
                break;
              case 2:
                this._charsetService.setgCharset(0, o.DEFAULT_CHARSET), this._charsetService.setgCharset(1, o.DEFAULT_CHARSET), this._charsetService.setgCharset(2, o.DEFAULT_CHARSET), this._charsetService.setgCharset(3, o.DEFAULT_CHARSET);
                break;
              case 3:
                this._optionsService.rawOptions.windowOptions.setWinLines && (this._bufferService.resize(132, this._bufferService.rows), this._onRequestReset.fire());
                break;
              case 6:
                this._coreService.decPrivateModes.origin = true, this._setCursor(0, 0);
                break;
              case 7:
                this._coreService.decPrivateModes.wraparound = true;
                break;
              case 12:
                this._optionsService.options.cursorBlink = true;
                break;
              case 45:
                this._coreService.decPrivateModes.reverseWraparound = true;
                break;
              case 66:
                this._logService.debug("Serial port requested application keypad."), this._coreService.decPrivateModes.applicationKeypad = true, this._onRequestSyncScrollBar.fire();
                break;
              case 9:
                this._coreMouseService.activeProtocol = "X10";
                break;
              case 1000:
                this._coreMouseService.activeProtocol = "VT200";
                break;
              case 1002:
                this._coreMouseService.activeProtocol = "DRAG";
                break;
              case 1003:
                this._coreMouseService.activeProtocol = "ANY";
                break;
              case 1004:
                this._coreService.decPrivateModes.sendFocus = true, this._onRequestSendFocus.fire();
                break;
              case 1005:
                this._logService.debug("DECSET 1005 not supported (see #2507)");
                break;
              case 1006:
                this._coreMouseService.activeEncoding = "SGR";
                break;
              case 1015:
                this._logService.debug("DECSET 1015 not supported (see #2507)");
                break;
              case 1016:
                this._coreMouseService.activeEncoding = "SGR_PIXELS";
                break;
              case 25:
                this._coreService.isCursorHidden = false;
                break;
              case 1048:
                this.saveCursor();
                break;
              case 1049:
                this.saveCursor();
              case 47:
              case 1047:
                this._bufferService.buffers.activateAltBuffer(this._eraseAttrData()), this._coreService.isCursorInitialized = true, this._onRequestRefreshRows.fire(0, this._bufferService.rows - 1), this._onRequestSyncScrollBar.fire();
                break;
              case 2004:
                this._coreService.decPrivateModes.bracketedPasteMode = true;
            }
          return true;
        }
        resetMode(e3) {
          for (let t3 = 0;t3 < e3.length; t3++)
            switch (e3.params[t3]) {
              case 4:
                this._coreService.modes.insertMode = false;
                break;
              case 20:
                this._optionsService.options.convertEol = false;
            }
          return true;
        }
        resetModePrivate(e3) {
          for (let t3 = 0;t3 < e3.length; t3++)
            switch (e3.params[t3]) {
              case 1:
                this._coreService.decPrivateModes.applicationCursorKeys = false;
                break;
              case 3:
                this._optionsService.rawOptions.windowOptions.setWinLines && (this._bufferService.resize(80, this._bufferService.rows), this._onRequestReset.fire());
                break;
              case 6:
                this._coreService.decPrivateModes.origin = false, this._setCursor(0, 0);
                break;
              case 7:
                this._coreService.decPrivateModes.wraparound = false;
                break;
              case 12:
                this._optionsService.options.cursorBlink = false;
                break;
              case 45:
                this._coreService.decPrivateModes.reverseWraparound = false;
                break;
              case 66:
                this._logService.debug("Switching back to normal keypad."), this._coreService.decPrivateModes.applicationKeypad = false, this._onRequestSyncScrollBar.fire();
                break;
              case 9:
              case 1000:
              case 1002:
              case 1003:
                this._coreMouseService.activeProtocol = "NONE";
                break;
              case 1004:
                this._coreService.decPrivateModes.sendFocus = false;
                break;
              case 1005:
                this._logService.debug("DECRST 1005 not supported (see #2507)");
                break;
              case 1006:
              case 1016:
                this._coreMouseService.activeEncoding = "DEFAULT";
                break;
              case 1015:
                this._logService.debug("DECRST 1015 not supported (see #2507)");
                break;
              case 25:
                this._coreService.isCursorHidden = true;
                break;
              case 1048:
                this.restoreCursor();
                break;
              case 1049:
              case 47:
              case 1047:
                this._bufferService.buffers.activateNormalBuffer(), e3.params[t3] === 1049 && this.restoreCursor(), this._coreService.isCursorInitialized = true, this._onRequestRefreshRows.fire(0, this._bufferService.rows - 1), this._onRequestSyncScrollBar.fire();
                break;
              case 2004:
                this._coreService.decPrivateModes.bracketedPasteMode = false;
            }
          return true;
        }
        requestMode(e3, t3) {
          const i3 = this._coreService.decPrivateModes, { activeProtocol: s3, activeEncoding: r2 } = this._coreMouseService, o2 = this._coreService, { buffers: a2, cols: h2 } = this._bufferService, { active: c2, alt: l2 } = a2, d2 = this._optionsService.rawOptions, _2 = (e4) => e4 ? 1 : 2, u2 = e3.params[0];
          return f2 = u2, v2 = t3 ? u2 === 2 ? 4 : u2 === 4 ? _2(o2.modes.insertMode) : u2 === 12 ? 3 : u2 === 20 ? _2(d2.convertEol) : 0 : u2 === 1 ? _2(i3.applicationCursorKeys) : u2 === 3 ? d2.windowOptions.setWinLines ? h2 === 80 ? 2 : h2 === 132 ? 1 : 0 : 0 : u2 === 6 ? _2(i3.origin) : u2 === 7 ? _2(i3.wraparound) : u2 === 8 ? 3 : u2 === 9 ? _2(s3 === "X10") : u2 === 12 ? _2(d2.cursorBlink) : u2 === 25 ? _2(!o2.isCursorHidden) : u2 === 45 ? _2(i3.reverseWraparound) : u2 === 66 ? _2(i3.applicationKeypad) : u2 === 67 ? 4 : u2 === 1000 ? _2(s3 === "VT200") : u2 === 1002 ? _2(s3 === "DRAG") : u2 === 1003 ? _2(s3 === "ANY") : u2 === 1004 ? _2(i3.sendFocus) : u2 === 1005 ? 4 : u2 === 1006 ? _2(r2 === "SGR") : u2 === 1015 ? 4 : u2 === 1016 ? _2(r2 === "SGR_PIXELS") : u2 === 1048 ? 1 : u2 === 47 || u2 === 1047 || u2 === 1049 ? _2(c2 === l2) : u2 === 2004 ? _2(i3.bracketedPasteMode) : 0, o2.triggerDataEvent(`${n.C0.ESC}[${t3 ? "" : "?"}${f2};${v2}$y`), true;
          var f2, v2;
        }
        _updateAttrColor(e3, t3, i3, s3, r2) {
          return t3 === 2 ? (e3 |= 50331648, e3 &= -16777216, e3 |= f.AttributeData.fromColorRGB([i3, s3, r2])) : t3 === 5 && (e3 &= -50331904, e3 |= 33554432 | 255 & i3), e3;
        }
        _extractColor(e3, t3, i3) {
          const s3 = [0, 0, -1, 0, 0, 0];
          let r2 = 0, n2 = 0;
          do {
            if (s3[n2 + r2] = e3.params[t3 + n2], e3.hasSubParams(t3 + n2)) {
              const i4 = e3.getSubParams(t3 + n2);
              let o2 = 0;
              do {
                s3[1] === 5 && (r2 = 1), s3[n2 + o2 + 1 + r2] = i4[o2];
              } while (++o2 < i4.length && o2 + n2 + 1 + r2 < s3.length);
              break;
            }
            if (s3[1] === 5 && n2 + r2 >= 2 || s3[1] === 2 && n2 + r2 >= 5)
              break;
            s3[1] && (r2 = 1);
          } while (++n2 + t3 < e3.length && n2 + r2 < s3.length);
          for (let e4 = 2;e4 < s3.length; ++e4)
            s3[e4] === -1 && (s3[e4] = 0);
          switch (s3[0]) {
            case 38:
              i3.fg = this._updateAttrColor(i3.fg, s3[1], s3[3], s3[4], s3[5]);
              break;
            case 48:
              i3.bg = this._updateAttrColor(i3.bg, s3[1], s3[3], s3[4], s3[5]);
              break;
            case 58:
              i3.extended = i3.extended.clone(), i3.extended.underlineColor = this._updateAttrColor(i3.extended.underlineColor, s3[1], s3[3], s3[4], s3[5]);
          }
          return n2;
        }
        _processUnderline(e3, t3) {
          t3.extended = t3.extended.clone(), (!~e3 || e3 > 5) && (e3 = 1), t3.extended.underlineStyle = e3, t3.fg |= 268435456, e3 === 0 && (t3.fg &= -268435457), t3.updateExtended();
        }
        _processSGR0(e3) {
          e3.fg = l.DEFAULT_ATTR_DATA.fg, e3.bg = l.DEFAULT_ATTR_DATA.bg, e3.extended = e3.extended.clone(), e3.extended.underlineStyle = 0, e3.extended.underlineColor &= -67108864, e3.updateExtended();
        }
        charAttributes(e3) {
          if (e3.length === 1 && e3.params[0] === 0)
            return this._processSGR0(this._curAttrData), true;
          const t3 = e3.length;
          let i3;
          const s3 = this._curAttrData;
          for (let r2 = 0;r2 < t3; r2++)
            i3 = e3.params[r2], i3 >= 30 && i3 <= 37 ? (s3.fg &= -50331904, s3.fg |= 16777216 | i3 - 30) : i3 >= 40 && i3 <= 47 ? (s3.bg &= -50331904, s3.bg |= 16777216 | i3 - 40) : i3 >= 90 && i3 <= 97 ? (s3.fg &= -50331904, s3.fg |= 16777224 | i3 - 90) : i3 >= 100 && i3 <= 107 ? (s3.bg &= -50331904, s3.bg |= 16777224 | i3 - 100) : i3 === 0 ? this._processSGR0(s3) : i3 === 1 ? s3.fg |= 134217728 : i3 === 3 ? s3.bg |= 67108864 : i3 === 4 ? (s3.fg |= 268435456, this._processUnderline(e3.hasSubParams(r2) ? e3.getSubParams(r2)[0] : 1, s3)) : i3 === 5 ? s3.fg |= 536870912 : i3 === 7 ? s3.fg |= 67108864 : i3 === 8 ? s3.fg |= 1073741824 : i3 === 9 ? s3.fg |= 2147483648 : i3 === 2 ? s3.bg |= 134217728 : i3 === 21 ? this._processUnderline(2, s3) : i3 === 22 ? (s3.fg &= -134217729, s3.bg &= -134217729) : i3 === 23 ? s3.bg &= -67108865 : i3 === 24 ? (s3.fg &= -268435457, this._processUnderline(0, s3)) : i3 === 25 ? s3.fg &= -536870913 : i3 === 27 ? s3.fg &= -67108865 : i3 === 28 ? s3.fg &= -1073741825 : i3 === 29 ? s3.fg &= 2147483647 : i3 === 39 ? (s3.fg &= -67108864, s3.fg |= 16777215 & l.DEFAULT_ATTR_DATA.fg) : i3 === 49 ? (s3.bg &= -67108864, s3.bg |= 16777215 & l.DEFAULT_ATTR_DATA.bg) : i3 === 38 || i3 === 48 || i3 === 58 ? r2 += this._extractColor(e3, r2, s3) : i3 === 53 ? s3.bg |= 1073741824 : i3 === 55 ? s3.bg &= -1073741825 : i3 === 59 ? (s3.extended = s3.extended.clone(), s3.extended.underlineColor = -1, s3.updateExtended()) : i3 === 100 ? (s3.fg &= -67108864, s3.fg |= 16777215 & l.DEFAULT_ATTR_DATA.fg, s3.bg &= -67108864, s3.bg |= 16777215 & l.DEFAULT_ATTR_DATA.bg) : this._logService.debug("Unknown SGR attribute: %d.", i3);
          return true;
        }
        deviceStatus(e3) {
          switch (e3.params[0]) {
            case 5:
              this._coreService.triggerDataEvent(`${n.C0.ESC}[0n`);
              break;
            case 6:
              const e4 = this._activeBuffer.y + 1, t3 = this._activeBuffer.x + 1;
              this._coreService.triggerDataEvent(`${n.C0.ESC}[${e4};${t3}R`);
          }
          return true;
        }
        deviceStatusPrivate(e3) {
          if (e3.params[0] === 6) {
            const e4 = this._activeBuffer.y + 1, t3 = this._activeBuffer.x + 1;
            this._coreService.triggerDataEvent(`${n.C0.ESC}[?${e4};${t3}R`);
          }
          return true;
        }
        softReset(e3) {
          return this._coreService.isCursorHidden = false, this._onRequestSyncScrollBar.fire(), this._activeBuffer.scrollTop = 0, this._activeBuffer.scrollBottom = this._bufferService.rows - 1, this._curAttrData = l.DEFAULT_ATTR_DATA.clone(), this._coreService.reset(), this._charsetService.reset(), this._activeBuffer.savedX = 0, this._activeBuffer.savedY = this._activeBuffer.ybase, this._activeBuffer.savedCurAttrData.fg = this._curAttrData.fg, this._activeBuffer.savedCurAttrData.bg = this._curAttrData.bg, this._activeBuffer.savedCharset = this._charsetService.charset, this._coreService.decPrivateModes.origin = false, true;
        }
        setCursorStyle(e3) {
          const t3 = e3.params[0] || 1;
          switch (t3) {
            case 1:
            case 2:
              this._optionsService.options.cursorStyle = "block";
              break;
            case 3:
            case 4:
              this._optionsService.options.cursorStyle = "underline";
              break;
            case 5:
            case 6:
              this._optionsService.options.cursorStyle = "bar";
          }
          const i3 = t3 % 2 == 1;
          return this._optionsService.options.cursorBlink = i3, true;
        }
        setScrollRegion(e3) {
          const t3 = e3.params[0] || 1;
          let i3;
          return (e3.length < 2 || (i3 = e3.params[1]) > this._bufferService.rows || i3 === 0) && (i3 = this._bufferService.rows), i3 > t3 && (this._activeBuffer.scrollTop = t3 - 1, this._activeBuffer.scrollBottom = i3 - 1, this._setCursor(0, 0)), true;
        }
        windowOptions(e3) {
          if (!w(e3.params[0], this._optionsService.rawOptions.windowOptions))
            return true;
          const t3 = e3.length > 1 ? e3.params[1] : 0;
          switch (e3.params[0]) {
            case 14:
              t3 !== 2 && this._onRequestWindowsOptionsReport.fire(y.GET_WIN_SIZE_PIXELS);
              break;
            case 16:
              this._onRequestWindowsOptionsReport.fire(y.GET_CELL_SIZE_PIXELS);
              break;
            case 18:
              this._bufferService && this._coreService.triggerDataEvent(`${n.C0.ESC}[8;${this._bufferService.rows};${this._bufferService.cols}t`);
              break;
            case 22:
              t3 !== 0 && t3 !== 2 || (this._windowTitleStack.push(this._windowTitle), this._windowTitleStack.length > 10 && this._windowTitleStack.shift()), t3 !== 0 && t3 !== 1 || (this._iconNameStack.push(this._iconName), this._iconNameStack.length > 10 && this._iconNameStack.shift());
              break;
            case 23:
              t3 !== 0 && t3 !== 2 || this._windowTitleStack.length && this.setTitle(this._windowTitleStack.pop()), t3 !== 0 && t3 !== 1 || this._iconNameStack.length && this.setIconName(this._iconNameStack.pop());
          }
          return true;
        }
        saveCursor(e3) {
          return this._activeBuffer.savedX = this._activeBuffer.x, this._activeBuffer.savedY = this._activeBuffer.ybase + this._activeBuffer.y, this._activeBuffer.savedCurAttrData.fg = this._curAttrData.fg, this._activeBuffer.savedCurAttrData.bg = this._curAttrData.bg, this._activeBuffer.savedCharset = this._charsetService.charset, true;
        }
        restoreCursor(e3) {
          return this._activeBuffer.x = this._activeBuffer.savedX || 0, this._activeBuffer.y = Math.max(this._activeBuffer.savedY - this._activeBuffer.ybase, 0), this._curAttrData.fg = this._activeBuffer.savedCurAttrData.fg, this._curAttrData.bg = this._activeBuffer.savedCurAttrData.bg, this._charsetService.charset = this._savedCharset, this._activeBuffer.savedCharset && (this._charsetService.charset = this._activeBuffer.savedCharset), this._restrictCursor(), true;
        }
        setTitle(e3) {
          return this._windowTitle = e3, this._onTitleChange.fire(e3), true;
        }
        setIconName(e3) {
          return this._iconName = e3, true;
        }
        setOrReportIndexedColor(e3) {
          const t3 = [], i3 = e3.split(";");
          for (;i3.length > 1; ) {
            const e4 = i3.shift(), s3 = i3.shift();
            if (/^\d+$/.exec(e4)) {
              const i4 = parseInt(e4);
              if (D(i4))
                if (s3 === "?")
                  t3.push({ type: 0, index: i4 });
                else {
                  const e5 = (0, S.parseColor)(s3);
                  e5 && t3.push({ type: 1, index: i4, color: e5 });
                }
            }
          }
          return t3.length && this._onColor.fire(t3), true;
        }
        setHyperlink(e3) {
          const t3 = e3.split(";");
          return !(t3.length < 2) && (t3[1] ? this._createHyperlink(t3[0], t3[1]) : !t3[0] && this._finishHyperlink());
        }
        _createHyperlink(e3, t3) {
          this._getCurrentLinkId() && this._finishHyperlink();
          const i3 = e3.split(":");
          let s3;
          const r2 = i3.findIndex((e4) => e4.startsWith("id="));
          return r2 !== -1 && (s3 = i3[r2].slice(3) || undefined), this._curAttrData.extended = this._curAttrData.extended.clone(), this._curAttrData.extended.urlId = this._oscLinkService.registerLink({ id: s3, uri: t3 }), this._curAttrData.updateExtended(), true;
        }
        _finishHyperlink() {
          return this._curAttrData.extended = this._curAttrData.extended.clone(), this._curAttrData.extended.urlId = 0, this._curAttrData.updateExtended(), true;
        }
        _setOrReportSpecialColor(e3, t3) {
          const i3 = e3.split(";");
          for (let e4 = 0;e4 < i3.length && !(t3 >= this._specialColors.length); ++e4, ++t3)
            if (i3[e4] === "?")
              this._onColor.fire([{ type: 0, index: this._specialColors[t3] }]);
            else {
              const s3 = (0, S.parseColor)(i3[e4]);
              s3 && this._onColor.fire([{ type: 1, index: this._specialColors[t3], color: s3 }]);
            }
          return true;
        }
        setOrReportFgColor(e3) {
          return this._setOrReportSpecialColor(e3, 0);
        }
        setOrReportBgColor(e3) {
          return this._setOrReportSpecialColor(e3, 1);
        }
        setOrReportCursorColor(e3) {
          return this._setOrReportSpecialColor(e3, 2);
        }
        restoreIndexedColor(e3) {
          if (!e3)
            return this._onColor.fire([{ type: 2 }]), true;
          const t3 = [], i3 = e3.split(";");
          for (let e4 = 0;e4 < i3.length; ++e4)
            if (/^\d+$/.exec(i3[e4])) {
              const s3 = parseInt(i3[e4]);
              D(s3) && t3.push({ type: 2, index: s3 });
            }
          return t3.length && this._onColor.fire(t3), true;
        }
        restoreFgColor(e3) {
          return this._onColor.fire([{ type: 2, index: 256 }]), true;
        }
        restoreBgColor(e3) {
          return this._onColor.fire([{ type: 2, index: 257 }]), true;
        }
        restoreCursorColor(e3) {
          return this._onColor.fire([{ type: 2, index: 258 }]), true;
        }
        nextLine() {
          return this._activeBuffer.x = 0, this.index(), true;
        }
        keypadApplicationMode() {
          return this._logService.debug("Serial port requested application keypad."), this._coreService.decPrivateModes.applicationKeypad = true, this._onRequestSyncScrollBar.fire(), true;
        }
        keypadNumericMode() {
          return this._logService.debug("Switching back to normal keypad."), this._coreService.decPrivateModes.applicationKeypad = false, this._onRequestSyncScrollBar.fire(), true;
        }
        selectDefaultCharset() {
          return this._charsetService.setgLevel(0), this._charsetService.setgCharset(0, o.DEFAULT_CHARSET), true;
        }
        selectCharset(e3) {
          return e3.length !== 2 ? (this.selectDefaultCharset(), true) : (e3[0] === "/" || this._charsetService.setgCharset(C[e3[0]], o.CHARSETS[e3[1]] || o.DEFAULT_CHARSET), true);
        }
        index() {
          return this._restrictCursor(), this._activeBuffer.y++, this._activeBuffer.y === this._activeBuffer.scrollBottom + 1 ? (this._activeBuffer.y--, this._bufferService.scroll(this._eraseAttrData())) : this._activeBuffer.y >= this._bufferService.rows && (this._activeBuffer.y = this._bufferService.rows - 1), this._restrictCursor(), true;
        }
        tabSet() {
          return this._activeBuffer.tabs[this._activeBuffer.x] = true, true;
        }
        reverseIndex() {
          if (this._restrictCursor(), this._activeBuffer.y === this._activeBuffer.scrollTop) {
            const e3 = this._activeBuffer.scrollBottom - this._activeBuffer.scrollTop;
            this._activeBuffer.lines.shiftElements(this._activeBuffer.ybase + this._activeBuffer.y, e3, 1), this._activeBuffer.lines.set(this._activeBuffer.ybase + this._activeBuffer.y, this._activeBuffer.getBlankLine(this._eraseAttrData())), this._dirtyRowTracker.markRangeDirty(this._activeBuffer.scrollTop, this._activeBuffer.scrollBottom);
          } else
            this._activeBuffer.y--, this._restrictCursor();
          return true;
        }
        fullReset() {
          return this._parser.reset(), this._onRequestReset.fire(), true;
        }
        reset() {
          this._curAttrData = l.DEFAULT_ATTR_DATA.clone(), this._eraseAttrDataInternal = l.DEFAULT_ATTR_DATA.clone();
        }
        _eraseAttrData() {
          return this._eraseAttrDataInternal.bg &= -67108864, this._eraseAttrDataInternal.bg |= 67108863 & this._curAttrData.bg, this._eraseAttrDataInternal;
        }
        setgLevel(e3) {
          return this._charsetService.setgLevel(e3), true;
        }
        screenAlignmentPattern() {
          const e3 = new u.CellData;
          e3.content = 1 << 22 | 69, e3.fg = this._curAttrData.fg, e3.bg = this._curAttrData.bg, this._setCursor(0, 0);
          for (let t3 = 0;t3 < this._bufferService.rows; ++t3) {
            const i3 = this._activeBuffer.ybase + this._activeBuffer.y + t3, s3 = this._activeBuffer.lines.get(i3);
            s3 && (s3.fill(e3), s3.isWrapped = false);
          }
          return this._dirtyRowTracker.markAllDirty(), this._setCursor(0, 0), true;
        }
        requestStatusString(e3, t3) {
          const i3 = this._bufferService.buffer, s3 = this._optionsService.rawOptions;
          return ((e4) => (this._coreService.triggerDataEvent(`${n.C0.ESC}${e4}${n.C0.ESC}\\`), true))(e3 === '"q' ? `P1$r${this._curAttrData.isProtected() ? 1 : 0}"q` : e3 === '"p' ? 'P1$r61;1"p' : e3 === "r" ? `P1$r${i3.scrollTop + 1};${i3.scrollBottom + 1}r` : e3 === "m" ? "P1$r0m" : e3 === " q" ? `P1$r${{ block: 2, underline: 4, bar: 6 }[s3.cursorStyle] - (s3.cursorBlink ? 1 : 0)} q` : "P0$r");
        }
        markRangeDirty(e3, t3) {
          this._dirtyRowTracker.markRangeDirty(e3, t3);
        }
      }
      t2.InputHandler = k;
      let L = class {
        constructor(e3) {
          this._bufferService = e3, this.clearRange();
        }
        clearRange() {
          this.start = this._bufferService.buffer.y, this.end = this._bufferService.buffer.y;
        }
        markDirty(e3) {
          e3 < this.start ? this.start = e3 : e3 > this.end && (this.end = e3);
        }
        markRangeDirty(e3, t3) {
          e3 > t3 && (E = e3, e3 = t3, t3 = E), e3 < this.start && (this.start = e3), t3 > this.end && (this.end = t3);
        }
        markAllDirty() {
          this.markRangeDirty(0, this._bufferService.rows - 1);
        }
      };
      function D(e3) {
        return 0 <= e3 && e3 < 256;
      }
      L = s2([r(0, v.IBufferService)], L);
    }, 844: (e2, t2) => {
      function i2(e3) {
        for (const t3 of e3)
          t3.dispose();
        e3.length = 0;
      }
      Object.defineProperty(t2, "__esModule", { value: true }), t2.getDisposeArrayDisposable = t2.disposeArray = t2.toDisposable = t2.MutableDisposable = t2.Disposable = undefined, t2.Disposable = class {
        constructor() {
          this._disposables = [], this._isDisposed = false;
        }
        dispose() {
          this._isDisposed = true;
          for (const e3 of this._disposables)
            e3.dispose();
          this._disposables.length = 0;
        }
        register(e3) {
          return this._disposables.push(e3), e3;
        }
        unregister(e3) {
          const t3 = this._disposables.indexOf(e3);
          t3 !== -1 && this._disposables.splice(t3, 1);
        }
      }, t2.MutableDisposable = class {
        constructor() {
          this._isDisposed = false;
        }
        get value() {
          return this._isDisposed ? undefined : this._value;
        }
        set value(e3) {
          this._isDisposed || e3 === this._value || (this._value?.dispose(), this._value = e3);
        }
        clear() {
          this.value = undefined;
        }
        dispose() {
          this._isDisposed = true, this._value?.dispose(), this._value = undefined;
        }
      }, t2.toDisposable = function(e3) {
        return { dispose: e3 };
      }, t2.disposeArray = i2, t2.getDisposeArrayDisposable = function(e3) {
        return { dispose: () => i2(e3) };
      };
    }, 1505: (e2, t2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.FourKeyMap = t2.TwoKeyMap = undefined;

      class i2 {
        constructor() {
          this._data = {};
        }
        set(e3, t3, i3) {
          this._data[e3] || (this._data[e3] = {}), this._data[e3][t3] = i3;
        }
        get(e3, t3) {
          return this._data[e3] ? this._data[e3][t3] : undefined;
        }
        clear() {
          this._data = {};
        }
      }
      t2.TwoKeyMap = i2, t2.FourKeyMap = class {
        constructor() {
          this._data = new i2;
        }
        set(e3, t3, s2, r, n) {
          this._data.get(e3, t3) || this._data.set(e3, t3, new i2), this._data.get(e3, t3).set(s2, r, n);
        }
        get(e3, t3, i3, s2) {
          return this._data.get(e3, t3)?.get(i3, s2);
        }
        clear() {
          this._data.clear();
        }
      };
    }, 6114: (e2, t2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.isChromeOS = t2.isLinux = t2.isWindows = t2.isIphone = t2.isIpad = t2.isMac = t2.getSafariVersion = t2.isSafari = t2.isLegacyEdge = t2.isFirefox = t2.isNode = undefined, t2.isNode = typeof process != "undefined" && "title" in process;
      const i2 = t2.isNode ? "node" : navigator.userAgent, s2 = t2.isNode ? "node" : navigator.platform;
      t2.isFirefox = i2.includes("Firefox"), t2.isLegacyEdge = i2.includes("Edge"), t2.isSafari = /^((?!chrome|android).)*safari/i.test(i2), t2.getSafariVersion = function() {
        if (!t2.isSafari)
          return 0;
        const e3 = i2.match(/Version\/(\d+)/);
        return e3 === null || e3.length < 2 ? 0 : parseInt(e3[1]);
      }, t2.isMac = ["Macintosh", "MacIntel", "MacPPC", "Mac68K"].includes(s2), t2.isIpad = s2 === "iPad", t2.isIphone = s2 === "iPhone", t2.isWindows = ["Windows", "Win16", "Win32", "WinCE"].includes(s2), t2.isLinux = s2.indexOf("Linux") >= 0, t2.isChromeOS = /\bCrOS\b/.test(i2);
    }, 6106: (e2, t2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.SortedList = undefined;
      let i2 = 0;
      t2.SortedList = class {
        constructor(e3) {
          this._getKey = e3, this._array = [];
        }
        clear() {
          this._array.length = 0;
        }
        insert(e3) {
          this._array.length !== 0 ? (i2 = this._search(this._getKey(e3)), this._array.splice(i2, 0, e3)) : this._array.push(e3);
        }
        delete(e3) {
          if (this._array.length === 0)
            return false;
          const t3 = this._getKey(e3);
          if (t3 === undefined)
            return false;
          if (i2 = this._search(t3), i2 === -1)
            return false;
          if (this._getKey(this._array[i2]) !== t3)
            return false;
          do {
            if (this._array[i2] === e3)
              return this._array.splice(i2, 1), true;
          } while (++i2 < this._array.length && this._getKey(this._array[i2]) === t3);
          return false;
        }
        *getKeyIterator(e3) {
          if (this._array.length !== 0 && (i2 = this._search(e3), !(i2 < 0 || i2 >= this._array.length) && this._getKey(this._array[i2]) === e3))
            do {
              yield this._array[i2];
            } while (++i2 < this._array.length && this._getKey(this._array[i2]) === e3);
        }
        forEachByKey(e3, t3) {
          if (this._array.length !== 0 && (i2 = this._search(e3), !(i2 < 0 || i2 >= this._array.length) && this._getKey(this._array[i2]) === e3))
            do {
              t3(this._array[i2]);
            } while (++i2 < this._array.length && this._getKey(this._array[i2]) === e3);
        }
        values() {
          return [...this._array].values();
        }
        _search(e3) {
          let t3 = 0, i3 = this._array.length - 1;
          for (;i3 >= t3; ) {
            let s2 = t3 + i3 >> 1;
            const r = this._getKey(this._array[s2]);
            if (r > e3)
              i3 = s2 - 1;
            else {
              if (!(r < e3)) {
                for (;s2 > 0 && this._getKey(this._array[s2 - 1]) === e3; )
                  s2--;
                return s2;
              }
              t3 = s2 + 1;
            }
          }
          return t3;
        }
      };
    }, 7226: (e2, t2, i2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.DebouncedIdleTask = t2.IdleTaskQueue = t2.PriorityTaskQueue = undefined;
      const s2 = i2(6114);

      class r {
        constructor() {
          this._tasks = [], this._i = 0;
        }
        enqueue(e3) {
          this._tasks.push(e3), this._start();
        }
        flush() {
          for (;this._i < this._tasks.length; )
            this._tasks[this._i]() || this._i++;
          this.clear();
        }
        clear() {
          this._idleCallback && (this._cancelCallback(this._idleCallback), this._idleCallback = undefined), this._i = 0, this._tasks.length = 0;
        }
        _start() {
          this._idleCallback || (this._idleCallback = this._requestCallback(this._process.bind(this)));
        }
        _process(e3) {
          this._idleCallback = undefined;
          let t3 = 0, i3 = 0, s3 = e3.timeRemaining(), r2 = 0;
          for (;this._i < this._tasks.length; ) {
            if (t3 = Date.now(), this._tasks[this._i]() || this._i++, t3 = Math.max(1, Date.now() - t3), i3 = Math.max(t3, i3), r2 = e3.timeRemaining(), 1.5 * i3 > r2)
              return s3 - t3 < -20 && console.warn(`task queue exceeded allotted deadline by ${Math.abs(Math.round(s3 - t3))}ms`), void this._start();
            s3 = r2;
          }
          this.clear();
        }
      }

      class n extends r {
        _requestCallback(e3) {
          return setTimeout(() => e3(this._createDeadline(16)));
        }
        _cancelCallback(e3) {
          clearTimeout(e3);
        }
        _createDeadline(e3) {
          const t3 = Date.now() + e3;
          return { timeRemaining: () => Math.max(0, t3 - Date.now()) };
        }
      }
      t2.PriorityTaskQueue = n, t2.IdleTaskQueue = !s2.isNode && "requestIdleCallback" in window ? class extends r {
        _requestCallback(e3) {
          return requestIdleCallback(e3);
        }
        _cancelCallback(e3) {
          cancelIdleCallback(e3);
        }
      } : n, t2.DebouncedIdleTask = class {
        constructor() {
          this._queue = new t2.IdleTaskQueue;
        }
        set(e3) {
          this._queue.clear(), this._queue.enqueue(e3);
        }
        flush() {
          this._queue.flush();
        }
      };
    }, 9282: (e2, t2, i2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.updateWindowsModeWrappedState = undefined;
      const s2 = i2(643);
      t2.updateWindowsModeWrappedState = function(e3) {
        const t3 = e3.buffer.lines.get(e3.buffer.ybase + e3.buffer.y - 1), i3 = t3?.get(e3.cols - 1), r = e3.buffer.lines.get(e3.buffer.ybase + e3.buffer.y);
        r && i3 && (r.isWrapped = i3[s2.CHAR_DATA_CODE_INDEX] !== s2.NULL_CELL_CODE && i3[s2.CHAR_DATA_CODE_INDEX] !== s2.WHITESPACE_CELL_CODE);
      };
    }, 3734: (e2, t2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.ExtendedAttrs = t2.AttributeData = undefined;

      class i2 {
        constructor() {
          this.fg = 0, this.bg = 0, this.extended = new s2;
        }
        static toColorRGB(e3) {
          return [e3 >>> 16 & 255, e3 >>> 8 & 255, 255 & e3];
        }
        static fromColorRGB(e3) {
          return (255 & e3[0]) << 16 | (255 & e3[1]) << 8 | 255 & e3[2];
        }
        clone() {
          const e3 = new i2;
          return e3.fg = this.fg, e3.bg = this.bg, e3.extended = this.extended.clone(), e3;
        }
        isInverse() {
          return 67108864 & this.fg;
        }
        isBold() {
          return 134217728 & this.fg;
        }
        isUnderline() {
          return this.hasExtendedAttrs() && this.extended.underlineStyle !== 0 ? 1 : 268435456 & this.fg;
        }
        isBlink() {
          return 536870912 & this.fg;
        }
        isInvisible() {
          return 1073741824 & this.fg;
        }
        isItalic() {
          return 67108864 & this.bg;
        }
        isDim() {
          return 134217728 & this.bg;
        }
        isStrikethrough() {
          return 2147483648 & this.fg;
        }
        isProtected() {
          return 536870912 & this.bg;
        }
        isOverline() {
          return 1073741824 & this.bg;
        }
        getFgColorMode() {
          return 50331648 & this.fg;
        }
        getBgColorMode() {
          return 50331648 & this.bg;
        }
        isFgRGB() {
          return (50331648 & this.fg) == 50331648;
        }
        isBgRGB() {
          return (50331648 & this.bg) == 50331648;
        }
        isFgPalette() {
          return (50331648 & this.fg) == 16777216 || (50331648 & this.fg) == 33554432;
        }
        isBgPalette() {
          return (50331648 & this.bg) == 16777216 || (50331648 & this.bg) == 33554432;
        }
        isFgDefault() {
          return (50331648 & this.fg) == 0;
        }
        isBgDefault() {
          return (50331648 & this.bg) == 0;
        }
        isAttributeDefault() {
          return this.fg === 0 && this.bg === 0;
        }
        getFgColor() {
          switch (50331648 & this.fg) {
            case 16777216:
            case 33554432:
              return 255 & this.fg;
            case 50331648:
              return 16777215 & this.fg;
            default:
              return -1;
          }
        }
        getBgColor() {
          switch (50331648 & this.bg) {
            case 16777216:
            case 33554432:
              return 255 & this.bg;
            case 50331648:
              return 16777215 & this.bg;
            default:
              return -1;
          }
        }
        hasExtendedAttrs() {
          return 268435456 & this.bg;
        }
        updateExtended() {
          this.extended.isEmpty() ? this.bg &= -268435457 : this.bg |= 268435456;
        }
        getUnderlineColor() {
          if (268435456 & this.bg && ~this.extended.underlineColor)
            switch (50331648 & this.extended.underlineColor) {
              case 16777216:
              case 33554432:
                return 255 & this.extended.underlineColor;
              case 50331648:
                return 16777215 & this.extended.underlineColor;
              default:
                return this.getFgColor();
            }
          return this.getFgColor();
        }
        getUnderlineColorMode() {
          return 268435456 & this.bg && ~this.extended.underlineColor ? 50331648 & this.extended.underlineColor : this.getFgColorMode();
        }
        isUnderlineColorRGB() {
          return 268435456 & this.bg && ~this.extended.underlineColor ? (50331648 & this.extended.underlineColor) == 50331648 : this.isFgRGB();
        }
        isUnderlineColorPalette() {
          return 268435456 & this.bg && ~this.extended.underlineColor ? (50331648 & this.extended.underlineColor) == 16777216 || (50331648 & this.extended.underlineColor) == 33554432 : this.isFgPalette();
        }
        isUnderlineColorDefault() {
          return 268435456 & this.bg && ~this.extended.underlineColor ? (50331648 & this.extended.underlineColor) == 0 : this.isFgDefault();
        }
        getUnderlineStyle() {
          return 268435456 & this.fg ? 268435456 & this.bg ? this.extended.underlineStyle : 1 : 0;
        }
        getUnderlineVariantOffset() {
          return this.extended.underlineVariantOffset;
        }
      }
      t2.AttributeData = i2;

      class s2 {
        get ext() {
          return this._urlId ? -469762049 & this._ext | this.underlineStyle << 26 : this._ext;
        }
        set ext(e3) {
          this._ext = e3;
        }
        get underlineStyle() {
          return this._urlId ? 5 : (469762048 & this._ext) >> 26;
        }
        set underlineStyle(e3) {
          this._ext &= -469762049, this._ext |= e3 << 26 & 469762048;
        }
        get underlineColor() {
          return 67108863 & this._ext;
        }
        set underlineColor(e3) {
          this._ext &= -67108864, this._ext |= 67108863 & e3;
        }
        get urlId() {
          return this._urlId;
        }
        set urlId(e3) {
          this._urlId = e3;
        }
        get underlineVariantOffset() {
          const e3 = (3758096384 & this._ext) >> 29;
          return e3 < 0 ? 4294967288 ^ e3 : e3;
        }
        set underlineVariantOffset(e3) {
          this._ext &= 536870911, this._ext |= e3 << 29 & 3758096384;
        }
        constructor(e3 = 0, t3 = 0) {
          this._ext = 0, this._urlId = 0, this._ext = e3, this._urlId = t3;
        }
        clone() {
          return new s2(this._ext, this._urlId);
        }
        isEmpty() {
          return this.underlineStyle === 0 && this._urlId === 0;
        }
      }
      t2.ExtendedAttrs = s2;
    }, 9092: (e2, t2, i2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.Buffer = t2.MAX_BUFFER_SIZE = undefined;
      const s2 = i2(6349), r = i2(7226), n = i2(3734), o = i2(8437), a = i2(4634), h = i2(511), c = i2(643), l = i2(4863), d = i2(7116);
      t2.MAX_BUFFER_SIZE = 4294967295, t2.Buffer = class {
        constructor(e3, t3, i3) {
          this._hasScrollback = e3, this._optionsService = t3, this._bufferService = i3, this.ydisp = 0, this.ybase = 0, this.y = 0, this.x = 0, this.tabs = {}, this.savedY = 0, this.savedX = 0, this.savedCurAttrData = o.DEFAULT_ATTR_DATA.clone(), this.savedCharset = d.DEFAULT_CHARSET, this.markers = [], this._nullCell = h.CellData.fromCharData([0, c.NULL_CELL_CHAR, c.NULL_CELL_WIDTH, c.NULL_CELL_CODE]), this._whitespaceCell = h.CellData.fromCharData([0, c.WHITESPACE_CELL_CHAR, c.WHITESPACE_CELL_WIDTH, c.WHITESPACE_CELL_CODE]), this._isClearing = false, this._memoryCleanupQueue = new r.IdleTaskQueue, this._memoryCleanupPosition = 0, this._cols = this._bufferService.cols, this._rows = this._bufferService.rows, this.lines = new s2.CircularList(this._getCorrectBufferLength(this._rows)), this.scrollTop = 0, this.scrollBottom = this._rows - 1, this.setupTabStops();
        }
        getNullCell(e3) {
          return e3 ? (this._nullCell.fg = e3.fg, this._nullCell.bg = e3.bg, this._nullCell.extended = e3.extended) : (this._nullCell.fg = 0, this._nullCell.bg = 0, this._nullCell.extended = new n.ExtendedAttrs), this._nullCell;
        }
        getWhitespaceCell(e3) {
          return e3 ? (this._whitespaceCell.fg = e3.fg, this._whitespaceCell.bg = e3.bg, this._whitespaceCell.extended = e3.extended) : (this._whitespaceCell.fg = 0, this._whitespaceCell.bg = 0, this._whitespaceCell.extended = new n.ExtendedAttrs), this._whitespaceCell;
        }
        getBlankLine(e3, t3) {
          return new o.BufferLine(this._bufferService.cols, this.getNullCell(e3), t3);
        }
        get hasScrollback() {
          return this._hasScrollback && this.lines.maxLength > this._rows;
        }
        get isCursorInViewport() {
          const e3 = this.ybase + this.y - this.ydisp;
          return e3 >= 0 && e3 < this._rows;
        }
        _getCorrectBufferLength(e3) {
          if (!this._hasScrollback)
            return e3;
          const i3 = e3 + this._optionsService.rawOptions.scrollback;
          return i3 > t2.MAX_BUFFER_SIZE ? t2.MAX_BUFFER_SIZE : i3;
        }
        fillViewportRows(e3) {
          if (this.lines.length === 0) {
            e3 === undefined && (e3 = o.DEFAULT_ATTR_DATA);
            let t3 = this._rows;
            for (;t3--; )
              this.lines.push(this.getBlankLine(e3));
          }
        }
        clear() {
          this.ydisp = 0, this.ybase = 0, this.y = 0, this.x = 0, this.lines = new s2.CircularList(this._getCorrectBufferLength(this._rows)), this.scrollTop = 0, this.scrollBottom = this._rows - 1, this.setupTabStops();
        }
        resize(e3, t3) {
          const i3 = this.getNullCell(o.DEFAULT_ATTR_DATA);
          let s3 = 0;
          const r2 = this._getCorrectBufferLength(t3);
          if (r2 > this.lines.maxLength && (this.lines.maxLength = r2), this.lines.length > 0) {
            if (this._cols < e3)
              for (let t4 = 0;t4 < this.lines.length; t4++)
                s3 += +this.lines.get(t4).resize(e3, i3);
            let n2 = 0;
            if (this._rows < t3)
              for (let s4 = this._rows;s4 < t3; s4++)
                this.lines.length < t3 + this.ybase && (this._optionsService.rawOptions.windowsMode || this._optionsService.rawOptions.windowsPty.backend !== undefined || this._optionsService.rawOptions.windowsPty.buildNumber !== undefined ? this.lines.push(new o.BufferLine(e3, i3)) : this.ybase > 0 && this.lines.length <= this.ybase + this.y + n2 + 1 ? (this.ybase--, n2++, this.ydisp > 0 && this.ydisp--) : this.lines.push(new o.BufferLine(e3, i3)));
            else
              for (let e4 = this._rows;e4 > t3; e4--)
                this.lines.length > t3 + this.ybase && (this.lines.length > this.ybase + this.y + 1 ? this.lines.pop() : (this.ybase++, this.ydisp++));
            if (r2 < this.lines.maxLength) {
              const e4 = this.lines.length - r2;
              e4 > 0 && (this.lines.trimStart(e4), this.ybase = Math.max(this.ybase - e4, 0), this.ydisp = Math.max(this.ydisp - e4, 0), this.savedY = Math.max(this.savedY - e4, 0)), this.lines.maxLength = r2;
            }
            this.x = Math.min(this.x, e3 - 1), this.y = Math.min(this.y, t3 - 1), n2 && (this.y += n2), this.savedX = Math.min(this.savedX, e3 - 1), this.scrollTop = 0;
          }
          if (this.scrollBottom = t3 - 1, this._isReflowEnabled && (this._reflow(e3, t3), this._cols > e3))
            for (let t4 = 0;t4 < this.lines.length; t4++)
              s3 += +this.lines.get(t4).resize(e3, i3);
          this._cols = e3, this._rows = t3, this._memoryCleanupQueue.clear(), s3 > 0.1 * this.lines.length && (this._memoryCleanupPosition = 0, this._memoryCleanupQueue.enqueue(() => this._batchedMemoryCleanup()));
        }
        _batchedMemoryCleanup() {
          let e3 = true;
          this._memoryCleanupPosition >= this.lines.length && (this._memoryCleanupPosition = 0, e3 = false);
          let t3 = 0;
          for (;this._memoryCleanupPosition < this.lines.length; )
            if (t3 += this.lines.get(this._memoryCleanupPosition++).cleanupMemory(), t3 > 100)
              return true;
          return e3;
        }
        get _isReflowEnabled() {
          const e3 = this._optionsService.rawOptions.windowsPty;
          return e3 && e3.buildNumber ? this._hasScrollback && e3.backend === "conpty" && e3.buildNumber >= 21376 : this._hasScrollback && !this._optionsService.rawOptions.windowsMode;
        }
        _reflow(e3, t3) {
          this._cols !== e3 && (e3 > this._cols ? this._reflowLarger(e3, t3) : this._reflowSmaller(e3, t3));
        }
        _reflowLarger(e3, t3) {
          const i3 = (0, a.reflowLargerGetLinesToRemove)(this.lines, this._cols, e3, this.ybase + this.y, this.getNullCell(o.DEFAULT_ATTR_DATA));
          if (i3.length > 0) {
            const s3 = (0, a.reflowLargerCreateNewLayout)(this.lines, i3);
            (0, a.reflowLargerApplyNewLayout)(this.lines, s3.layout), this._reflowLargerAdjustViewport(e3, t3, s3.countRemoved);
          }
        }
        _reflowLargerAdjustViewport(e3, t3, i3) {
          const s3 = this.getNullCell(o.DEFAULT_ATTR_DATA);
          let r2 = i3;
          for (;r2-- > 0; )
            this.ybase === 0 ? (this.y > 0 && this.y--, this.lines.length < t3 && this.lines.push(new o.BufferLine(e3, s3))) : (this.ydisp === this.ybase && this.ydisp--, this.ybase--);
          this.savedY = Math.max(this.savedY - i3, 0);
        }
        _reflowSmaller(e3, t3) {
          const i3 = this.getNullCell(o.DEFAULT_ATTR_DATA), s3 = [];
          let r2 = 0;
          for (let n2 = this.lines.length - 1;n2 >= 0; n2--) {
            let h2 = this.lines.get(n2);
            if (!h2 || !h2.isWrapped && h2.getTrimmedLength() <= e3)
              continue;
            const c2 = [h2];
            for (;h2.isWrapped && n2 > 0; )
              h2 = this.lines.get(--n2), c2.unshift(h2);
            const l2 = this.ybase + this.y;
            if (l2 >= n2 && l2 < n2 + c2.length)
              continue;
            const d2 = c2[c2.length - 1].getTrimmedLength(), _ = (0, a.reflowSmallerGetNewLineLengths)(c2, this._cols, e3), u = _.length - c2.length;
            let f;
            f = this.ybase === 0 && this.y !== this.lines.length - 1 ? Math.max(0, this.y - this.lines.maxLength + u) : Math.max(0, this.lines.length - this.lines.maxLength + u);
            const v = [];
            for (let e4 = 0;e4 < u; e4++) {
              const e5 = this.getBlankLine(o.DEFAULT_ATTR_DATA, true);
              v.push(e5);
            }
            v.length > 0 && (s3.push({ start: n2 + c2.length + r2, newLines: v }), r2 += v.length), c2.push(...v);
            let p = _.length - 1, g = _[p];
            g === 0 && (p--, g = _[p]);
            let m = c2.length - u - 1, S = d2;
            for (;m >= 0; ) {
              const e4 = Math.min(S, g);
              if (c2[p] === undefined)
                break;
              if (c2[p].copyCellsFrom(c2[m], S - e4, g - e4, e4, true), g -= e4, g === 0 && (p--, g = _[p]), S -= e4, S === 0) {
                m--;
                const e5 = Math.max(m, 0);
                S = (0, a.getWrappedLineTrimmedLength)(c2, e5, this._cols);
              }
            }
            for (let t4 = 0;t4 < c2.length; t4++)
              _[t4] < e3 && c2[t4].setCell(_[t4], i3);
            let C = u - f;
            for (;C-- > 0; )
              this.ybase === 0 ? this.y < t3 - 1 ? (this.y++, this.lines.pop()) : (this.ybase++, this.ydisp++) : this.ybase < Math.min(this.lines.maxLength, this.lines.length + r2) - t3 && (this.ybase === this.ydisp && this.ydisp++, this.ybase++);
            this.savedY = Math.min(this.savedY + u, this.ybase + t3 - 1);
          }
          if (s3.length > 0) {
            const e4 = [], t4 = [];
            for (let e5 = 0;e5 < this.lines.length; e5++)
              t4.push(this.lines.get(e5));
            const i4 = this.lines.length;
            let n2 = i4 - 1, o2 = 0, a2 = s3[o2];
            this.lines.length = Math.min(this.lines.maxLength, this.lines.length + r2);
            let h2 = 0;
            for (let c3 = Math.min(this.lines.maxLength - 1, i4 + r2 - 1);c3 >= 0; c3--)
              if (a2 && a2.start > n2 + h2) {
                for (let e5 = a2.newLines.length - 1;e5 >= 0; e5--)
                  this.lines.set(c3--, a2.newLines[e5]);
                c3++, e4.push({ index: n2 + 1, amount: a2.newLines.length }), h2 += a2.newLines.length, a2 = s3[++o2];
              } else
                this.lines.set(c3, t4[n2--]);
            let c2 = 0;
            for (let t5 = e4.length - 1;t5 >= 0; t5--)
              e4[t5].index += c2, this.lines.onInsertEmitter.fire(e4[t5]), c2 += e4[t5].amount;
            const l2 = Math.max(0, i4 + r2 - this.lines.maxLength);
            l2 > 0 && this.lines.onTrimEmitter.fire(l2);
          }
        }
        translateBufferLineToString(e3, t3, i3 = 0, s3) {
          const r2 = this.lines.get(e3);
          return r2 ? r2.translateToString(t3, i3, s3) : "";
        }
        getWrappedRangeForLine(e3) {
          let t3 = e3, i3 = e3;
          for (;t3 > 0 && this.lines.get(t3).isWrapped; )
            t3--;
          for (;i3 + 1 < this.lines.length && this.lines.get(i3 + 1).isWrapped; )
            i3++;
          return { first: t3, last: i3 };
        }
        setupTabStops(e3) {
          for (e3 != null ? this.tabs[e3] || (e3 = this.prevStop(e3)) : (this.tabs = {}, e3 = 0);e3 < this._cols; e3 += this._optionsService.rawOptions.tabStopWidth)
            this.tabs[e3] = true;
        }
        prevStop(e3) {
          for (e3 == null && (e3 = this.x);!this.tabs[--e3] && e3 > 0; )
            ;
          return e3 >= this._cols ? this._cols - 1 : e3 < 0 ? 0 : e3;
        }
        nextStop(e3) {
          for (e3 == null && (e3 = this.x);!this.tabs[++e3] && e3 < this._cols; )
            ;
          return e3 >= this._cols ? this._cols - 1 : e3 < 0 ? 0 : e3;
        }
        clearMarkers(e3) {
          this._isClearing = true;
          for (let t3 = 0;t3 < this.markers.length; t3++)
            this.markers[t3].line === e3 && (this.markers[t3].dispose(), this.markers.splice(t3--, 1));
          this._isClearing = false;
        }
        clearAllMarkers() {
          this._isClearing = true;
          for (let e3 = 0;e3 < this.markers.length; e3++)
            this.markers[e3].dispose(), this.markers.splice(e3--, 1);
          this._isClearing = false;
        }
        addMarker(e3) {
          const t3 = new l.Marker(e3);
          return this.markers.push(t3), t3.register(this.lines.onTrim((e4) => {
            t3.line -= e4, t3.line < 0 && t3.dispose();
          })), t3.register(this.lines.onInsert((e4) => {
            t3.line >= e4.index && (t3.line += e4.amount);
          })), t3.register(this.lines.onDelete((e4) => {
            t3.line >= e4.index && t3.line < e4.index + e4.amount && t3.dispose(), t3.line > e4.index && (t3.line -= e4.amount);
          })), t3.register(t3.onDispose(() => this._removeMarker(t3))), t3;
        }
        _removeMarker(e3) {
          this._isClearing || this.markers.splice(this.markers.indexOf(e3), 1);
        }
      };
    }, 8437: (e2, t2, i2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.BufferLine = t2.DEFAULT_ATTR_DATA = undefined;
      const s2 = i2(3734), r = i2(511), n = i2(643), o = i2(482);
      t2.DEFAULT_ATTR_DATA = Object.freeze(new s2.AttributeData);
      let a = 0;

      class h {
        constructor(e3, t3, i3 = false) {
          this.isWrapped = i3, this._combined = {}, this._extendedAttrs = {}, this._data = new Uint32Array(3 * e3);
          const s3 = t3 || r.CellData.fromCharData([0, n.NULL_CELL_CHAR, n.NULL_CELL_WIDTH, n.NULL_CELL_CODE]);
          for (let t4 = 0;t4 < e3; ++t4)
            this.setCell(t4, s3);
          this.length = e3;
        }
        get(e3) {
          const t3 = this._data[3 * e3 + 0], i3 = 2097151 & t3;
          return [this._data[3 * e3 + 1], 2097152 & t3 ? this._combined[e3] : i3 ? (0, o.stringFromCodePoint)(i3) : "", t3 >> 22, 2097152 & t3 ? this._combined[e3].charCodeAt(this._combined[e3].length - 1) : i3];
        }
        set(e3, t3) {
          this._data[3 * e3 + 1] = t3[n.CHAR_DATA_ATTR_INDEX], t3[n.CHAR_DATA_CHAR_INDEX].length > 1 ? (this._combined[e3] = t3[1], this._data[3 * e3 + 0] = 2097152 | e3 | t3[n.CHAR_DATA_WIDTH_INDEX] << 22) : this._data[3 * e3 + 0] = t3[n.CHAR_DATA_CHAR_INDEX].charCodeAt(0) | t3[n.CHAR_DATA_WIDTH_INDEX] << 22;
        }
        getWidth(e3) {
          return this._data[3 * e3 + 0] >> 22;
        }
        hasWidth(e3) {
          return 12582912 & this._data[3 * e3 + 0];
        }
        getFg(e3) {
          return this._data[3 * e3 + 1];
        }
        getBg(e3) {
          return this._data[3 * e3 + 2];
        }
        hasContent(e3) {
          return 4194303 & this._data[3 * e3 + 0];
        }
        getCodePoint(e3) {
          const t3 = this._data[3 * e3 + 0];
          return 2097152 & t3 ? this._combined[e3].charCodeAt(this._combined[e3].length - 1) : 2097151 & t3;
        }
        isCombined(e3) {
          return 2097152 & this._data[3 * e3 + 0];
        }
        getString(e3) {
          const t3 = this._data[3 * e3 + 0];
          return 2097152 & t3 ? this._combined[e3] : 2097151 & t3 ? (0, o.stringFromCodePoint)(2097151 & t3) : "";
        }
        isProtected(e3) {
          return 536870912 & this._data[3 * e3 + 2];
        }
        loadCell(e3, t3) {
          return a = 3 * e3, t3.content = this._data[a + 0], t3.fg = this._data[a + 1], t3.bg = this._data[a + 2], 2097152 & t3.content && (t3.combinedData = this._combined[e3]), 268435456 & t3.bg && (t3.extended = this._extendedAttrs[e3]), t3;
        }
        setCell(e3, t3) {
          2097152 & t3.content && (this._combined[e3] = t3.combinedData), 268435456 & t3.bg && (this._extendedAttrs[e3] = t3.extended), this._data[3 * e3 + 0] = t3.content, this._data[3 * e3 + 1] = t3.fg, this._data[3 * e3 + 2] = t3.bg;
        }
        setCellFromCodepoint(e3, t3, i3, s3) {
          268435456 & s3.bg && (this._extendedAttrs[e3] = s3.extended), this._data[3 * e3 + 0] = t3 | i3 << 22, this._data[3 * e3 + 1] = s3.fg, this._data[3 * e3 + 2] = s3.bg;
        }
        addCodepointToCell(e3, t3, i3) {
          let s3 = this._data[3 * e3 + 0];
          2097152 & s3 ? this._combined[e3] += (0, o.stringFromCodePoint)(t3) : 2097151 & s3 ? (this._combined[e3] = (0, o.stringFromCodePoint)(2097151 & s3) + (0, o.stringFromCodePoint)(t3), s3 &= -2097152, s3 |= 2097152) : s3 = t3 | 1 << 22, i3 && (s3 &= -12582913, s3 |= i3 << 22), this._data[3 * e3 + 0] = s3;
        }
        insertCells(e3, t3, i3) {
          if ((e3 %= this.length) && this.getWidth(e3 - 1) === 2 && this.setCellFromCodepoint(e3 - 1, 0, 1, i3), t3 < this.length - e3) {
            const s3 = new r.CellData;
            for (let i4 = this.length - e3 - t3 - 1;i4 >= 0; --i4)
              this.setCell(e3 + t3 + i4, this.loadCell(e3 + i4, s3));
            for (let s4 = 0;s4 < t3; ++s4)
              this.setCell(e3 + s4, i3);
          } else
            for (let t4 = e3;t4 < this.length; ++t4)
              this.setCell(t4, i3);
          this.getWidth(this.length - 1) === 2 && this.setCellFromCodepoint(this.length - 1, 0, 1, i3);
        }
        deleteCells(e3, t3, i3) {
          if (e3 %= this.length, t3 < this.length - e3) {
            const s3 = new r.CellData;
            for (let i4 = 0;i4 < this.length - e3 - t3; ++i4)
              this.setCell(e3 + i4, this.loadCell(e3 + t3 + i4, s3));
            for (let e4 = this.length - t3;e4 < this.length; ++e4)
              this.setCell(e4, i3);
          } else
            for (let t4 = e3;t4 < this.length; ++t4)
              this.setCell(t4, i3);
          e3 && this.getWidth(e3 - 1) === 2 && this.setCellFromCodepoint(e3 - 1, 0, 1, i3), this.getWidth(e3) !== 0 || this.hasContent(e3) || this.setCellFromCodepoint(e3, 0, 1, i3);
        }
        replaceCells(e3, t3, i3, s3 = false) {
          if (s3)
            for (e3 && this.getWidth(e3 - 1) === 2 && !this.isProtected(e3 - 1) && this.setCellFromCodepoint(e3 - 1, 0, 1, i3), t3 < this.length && this.getWidth(t3 - 1) === 2 && !this.isProtected(t3) && this.setCellFromCodepoint(t3, 0, 1, i3);e3 < t3 && e3 < this.length; )
              this.isProtected(e3) || this.setCell(e3, i3), e3++;
          else
            for (e3 && this.getWidth(e3 - 1) === 2 && this.setCellFromCodepoint(e3 - 1, 0, 1, i3), t3 < this.length && this.getWidth(t3 - 1) === 2 && this.setCellFromCodepoint(t3, 0, 1, i3);e3 < t3 && e3 < this.length; )
              this.setCell(e3++, i3);
        }
        resize(e3, t3) {
          if (e3 === this.length)
            return 4 * this._data.length * 2 < this._data.buffer.byteLength;
          const i3 = 3 * e3;
          if (e3 > this.length) {
            if (this._data.buffer.byteLength >= 4 * i3)
              this._data = new Uint32Array(this._data.buffer, 0, i3);
            else {
              const e4 = new Uint32Array(i3);
              e4.set(this._data), this._data = e4;
            }
            for (let i4 = this.length;i4 < e3; ++i4)
              this.setCell(i4, t3);
          } else {
            this._data = this._data.subarray(0, i3);
            const t4 = Object.keys(this._combined);
            for (let i4 = 0;i4 < t4.length; i4++) {
              const s4 = parseInt(t4[i4], 10);
              s4 >= e3 && delete this._combined[s4];
            }
            const s3 = Object.keys(this._extendedAttrs);
            for (let t5 = 0;t5 < s3.length; t5++) {
              const i4 = parseInt(s3[t5], 10);
              i4 >= e3 && delete this._extendedAttrs[i4];
            }
          }
          return this.length = e3, 4 * i3 * 2 < this._data.buffer.byteLength;
        }
        cleanupMemory() {
          if (4 * this._data.length * 2 < this._data.buffer.byteLength) {
            const e3 = new Uint32Array(this._data.length);
            return e3.set(this._data), this._data = e3, 1;
          }
          return 0;
        }
        fill(e3, t3 = false) {
          if (t3)
            for (let t4 = 0;t4 < this.length; ++t4)
              this.isProtected(t4) || this.setCell(t4, e3);
          else {
            this._combined = {}, this._extendedAttrs = {};
            for (let t4 = 0;t4 < this.length; ++t4)
              this.setCell(t4, e3);
          }
        }
        copyFrom(e3) {
          this.length !== e3.length ? this._data = new Uint32Array(e3._data) : this._data.set(e3._data), this.length = e3.length, this._combined = {};
          for (const t3 in e3._combined)
            this._combined[t3] = e3._combined[t3];
          this._extendedAttrs = {};
          for (const t3 in e3._extendedAttrs)
            this._extendedAttrs[t3] = e3._extendedAttrs[t3];
          this.isWrapped = e3.isWrapped;
        }
        clone() {
          const e3 = new h(0);
          e3._data = new Uint32Array(this._data), e3.length = this.length;
          for (const t3 in this._combined)
            e3._combined[t3] = this._combined[t3];
          for (const t3 in this._extendedAttrs)
            e3._extendedAttrs[t3] = this._extendedAttrs[t3];
          return e3.isWrapped = this.isWrapped, e3;
        }
        getTrimmedLength() {
          for (let e3 = this.length - 1;e3 >= 0; --e3)
            if (4194303 & this._data[3 * e3 + 0])
              return e3 + (this._data[3 * e3 + 0] >> 22);
          return 0;
        }
        getNoBgTrimmedLength() {
          for (let e3 = this.length - 1;e3 >= 0; --e3)
            if (4194303 & this._data[3 * e3 + 0] || 50331648 & this._data[3 * e3 + 2])
              return e3 + (this._data[3 * e3 + 0] >> 22);
          return 0;
        }
        copyCellsFrom(e3, t3, i3, s3, r2) {
          const n2 = e3._data;
          if (r2)
            for (let r3 = s3 - 1;r3 >= 0; r3--) {
              for (let e4 = 0;e4 < 3; e4++)
                this._data[3 * (i3 + r3) + e4] = n2[3 * (t3 + r3) + e4];
              268435456 & n2[3 * (t3 + r3) + 2] && (this._extendedAttrs[i3 + r3] = e3._extendedAttrs[t3 + r3]);
            }
          else
            for (let r3 = 0;r3 < s3; r3++) {
              for (let e4 = 0;e4 < 3; e4++)
                this._data[3 * (i3 + r3) + e4] = n2[3 * (t3 + r3) + e4];
              268435456 & n2[3 * (t3 + r3) + 2] && (this._extendedAttrs[i3 + r3] = e3._extendedAttrs[t3 + r3]);
            }
          const o2 = Object.keys(e3._combined);
          for (let s4 = 0;s4 < o2.length; s4++) {
            const r3 = parseInt(o2[s4], 10);
            r3 >= t3 && (this._combined[r3 - t3 + i3] = e3._combined[r3]);
          }
        }
        translateToString(e3, t3, i3, s3) {
          t3 = t3 ?? 0, i3 = i3 ?? this.length, e3 && (i3 = Math.min(i3, this.getTrimmedLength())), s3 && (s3.length = 0);
          let r2 = "";
          for (;t3 < i3; ) {
            const e4 = this._data[3 * t3 + 0], i4 = 2097151 & e4, a2 = 2097152 & e4 ? this._combined[t3] : i4 ? (0, o.stringFromCodePoint)(i4) : n.WHITESPACE_CELL_CHAR;
            if (r2 += a2, s3)
              for (let e5 = 0;e5 < a2.length; ++e5)
                s3.push(t3);
            t3 += e4 >> 22 || 1;
          }
          return s3 && s3.push(t3), r2;
        }
      }
      t2.BufferLine = h;
    }, 4841: (e2, t2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.getRangeLength = undefined, t2.getRangeLength = function(e3, t3) {
        if (e3.start.y > e3.end.y)
          throw new Error(`Buffer range end (${e3.end.x}, ${e3.end.y}) cannot be before start (${e3.start.x}, ${e3.start.y})`);
        return t3 * (e3.end.y - e3.start.y) + (e3.end.x - e3.start.x + 1);
      };
    }, 4634: (e2, t2) => {
      function i2(e3, t3, i3) {
        if (t3 === e3.length - 1)
          return e3[t3].getTrimmedLength();
        const s2 = !e3[t3].hasContent(i3 - 1) && e3[t3].getWidth(i3 - 1) === 1, r = e3[t3 + 1].getWidth(0) === 2;
        return s2 && r ? i3 - 1 : i3;
      }
      Object.defineProperty(t2, "__esModule", { value: true }), t2.getWrappedLineTrimmedLength = t2.reflowSmallerGetNewLineLengths = t2.reflowLargerApplyNewLayout = t2.reflowLargerCreateNewLayout = t2.reflowLargerGetLinesToRemove = undefined, t2.reflowLargerGetLinesToRemove = function(e3, t3, s2, r, n) {
        const o = [];
        for (let a = 0;a < e3.length - 1; a++) {
          let h = a, c = e3.get(++h);
          if (!c.isWrapped)
            continue;
          const l = [e3.get(a)];
          for (;h < e3.length && c.isWrapped; )
            l.push(c), c = e3.get(++h);
          if (r >= a && r < h) {
            a += l.length - 1;
            continue;
          }
          let d = 0, _ = i2(l, d, t3), u = 1, f = 0;
          for (;u < l.length; ) {
            const e4 = i2(l, u, t3), r2 = e4 - f, o2 = s2 - _, a2 = Math.min(r2, o2);
            l[d].copyCellsFrom(l[u], f, _, a2, false), _ += a2, _ === s2 && (d++, _ = 0), f += a2, f === e4 && (u++, f = 0), _ === 0 && d !== 0 && l[d - 1].getWidth(s2 - 1) === 2 && (l[d].copyCellsFrom(l[d - 1], s2 - 1, _++, 1, false), l[d - 1].setCell(s2 - 1, n));
          }
          l[d].replaceCells(_, s2, n);
          let v = 0;
          for (let e4 = l.length - 1;e4 > 0 && (e4 > d || l[e4].getTrimmedLength() === 0); e4--)
            v++;
          v > 0 && (o.push(a + l.length - v), o.push(v)), a += l.length - 1;
        }
        return o;
      }, t2.reflowLargerCreateNewLayout = function(e3, t3) {
        const i3 = [];
        let s2 = 0, r = t3[s2], n = 0;
        for (let o = 0;o < e3.length; o++)
          if (r === o) {
            const i4 = t3[++s2];
            e3.onDeleteEmitter.fire({ index: o - n, amount: i4 }), o += i4 - 1, n += i4, r = t3[++s2];
          } else
            i3.push(o);
        return { layout: i3, countRemoved: n };
      }, t2.reflowLargerApplyNewLayout = function(e3, t3) {
        const i3 = [];
        for (let s2 = 0;s2 < t3.length; s2++)
          i3.push(e3.get(t3[s2]));
        for (let t4 = 0;t4 < i3.length; t4++)
          e3.set(t4, i3[t4]);
        e3.length = t3.length;
      }, t2.reflowSmallerGetNewLineLengths = function(e3, t3, s2) {
        const r = [], n = e3.map((s3, r2) => i2(e3, r2, t3)).reduce((e4, t4) => e4 + t4);
        let o = 0, a = 0, h = 0;
        for (;h < n; ) {
          if (n - h < s2) {
            r.push(n - h);
            break;
          }
          o += s2;
          const c = i2(e3, a, t3);
          o > c && (o -= c, a++);
          const l = e3[a].getWidth(o - 1) === 2;
          l && o--;
          const d = l ? s2 - 1 : s2;
          r.push(d), h += d;
        }
        return r;
      }, t2.getWrappedLineTrimmedLength = i2;
    }, 5295: (e2, t2, i2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.BufferSet = undefined;
      const s2 = i2(8460), r = i2(844), n = i2(9092);

      class o extends r.Disposable {
        constructor(e3, t3) {
          super(), this._optionsService = e3, this._bufferService = t3, this._onBufferActivate = this.register(new s2.EventEmitter), this.onBufferActivate = this._onBufferActivate.event, this.reset(), this.register(this._optionsService.onSpecificOptionChange("scrollback", () => this.resize(this._bufferService.cols, this._bufferService.rows))), this.register(this._optionsService.onSpecificOptionChange("tabStopWidth", () => this.setupTabStops()));
        }
        reset() {
          this._normal = new n.Buffer(true, this._optionsService, this._bufferService), this._normal.fillViewportRows(), this._alt = new n.Buffer(false, this._optionsService, this._bufferService), this._activeBuffer = this._normal, this._onBufferActivate.fire({ activeBuffer: this._normal, inactiveBuffer: this._alt }), this.setupTabStops();
        }
        get alt() {
          return this._alt;
        }
        get active() {
          return this._activeBuffer;
        }
        get normal() {
          return this._normal;
        }
        activateNormalBuffer() {
          this._activeBuffer !== this._normal && (this._normal.x = this._alt.x, this._normal.y = this._alt.y, this._alt.clearAllMarkers(), this._alt.clear(), this._activeBuffer = this._normal, this._onBufferActivate.fire({ activeBuffer: this._normal, inactiveBuffer: this._alt }));
        }
        activateAltBuffer(e3) {
          this._activeBuffer !== this._alt && (this._alt.fillViewportRows(e3), this._alt.x = this._normal.x, this._alt.y = this._normal.y, this._activeBuffer = this._alt, this._onBufferActivate.fire({ activeBuffer: this._alt, inactiveBuffer: this._normal }));
        }
        resize(e3, t3) {
          this._normal.resize(e3, t3), this._alt.resize(e3, t3), this.setupTabStops(e3);
        }
        setupTabStops(e3) {
          this._normal.setupTabStops(e3), this._alt.setupTabStops(e3);
        }
      }
      t2.BufferSet = o;
    }, 511: (e2, t2, i2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.CellData = undefined;
      const s2 = i2(482), r = i2(643), n = i2(3734);

      class o extends n.AttributeData {
        constructor() {
          super(...arguments), this.content = 0, this.fg = 0, this.bg = 0, this.extended = new n.ExtendedAttrs, this.combinedData = "";
        }
        static fromCharData(e3) {
          const t3 = new o;
          return t3.setFromCharData(e3), t3;
        }
        isCombined() {
          return 2097152 & this.content;
        }
        getWidth() {
          return this.content >> 22;
        }
        getChars() {
          return 2097152 & this.content ? this.combinedData : 2097151 & this.content ? (0, s2.stringFromCodePoint)(2097151 & this.content) : "";
        }
        getCode() {
          return this.isCombined() ? this.combinedData.charCodeAt(this.combinedData.length - 1) : 2097151 & this.content;
        }
        setFromCharData(e3) {
          this.fg = e3[r.CHAR_DATA_ATTR_INDEX], this.bg = 0;
          let t3 = false;
          if (e3[r.CHAR_DATA_CHAR_INDEX].length > 2)
            t3 = true;
          else if (e3[r.CHAR_DATA_CHAR_INDEX].length === 2) {
            const i3 = e3[r.CHAR_DATA_CHAR_INDEX].charCodeAt(0);
            if (55296 <= i3 && i3 <= 56319) {
              const s3 = e3[r.CHAR_DATA_CHAR_INDEX].charCodeAt(1);
              56320 <= s3 && s3 <= 57343 ? this.content = 1024 * (i3 - 55296) + s3 - 56320 + 65536 | e3[r.CHAR_DATA_WIDTH_INDEX] << 22 : t3 = true;
            } else
              t3 = true;
          } else
            this.content = e3[r.CHAR_DATA_CHAR_INDEX].charCodeAt(0) | e3[r.CHAR_DATA_WIDTH_INDEX] << 22;
          t3 && (this.combinedData = e3[r.CHAR_DATA_CHAR_INDEX], this.content = 2097152 | e3[r.CHAR_DATA_WIDTH_INDEX] << 22);
        }
        getAsCharData() {
          return [this.fg, this.getChars(), this.getWidth(), this.getCode()];
        }
      }
      t2.CellData = o;
    }, 643: (e2, t2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.WHITESPACE_CELL_CODE = t2.WHITESPACE_CELL_WIDTH = t2.WHITESPACE_CELL_CHAR = t2.NULL_CELL_CODE = t2.NULL_CELL_WIDTH = t2.NULL_CELL_CHAR = t2.CHAR_DATA_CODE_INDEX = t2.CHAR_DATA_WIDTH_INDEX = t2.CHAR_DATA_CHAR_INDEX = t2.CHAR_DATA_ATTR_INDEX = t2.DEFAULT_EXT = t2.DEFAULT_ATTR = t2.DEFAULT_COLOR = undefined, t2.DEFAULT_COLOR = 0, t2.DEFAULT_ATTR = 256 | t2.DEFAULT_COLOR << 9, t2.DEFAULT_EXT = 0, t2.CHAR_DATA_ATTR_INDEX = 0, t2.CHAR_DATA_CHAR_INDEX = 1, t2.CHAR_DATA_WIDTH_INDEX = 2, t2.CHAR_DATA_CODE_INDEX = 3, t2.NULL_CELL_CHAR = "", t2.NULL_CELL_WIDTH = 1, t2.NULL_CELL_CODE = 0, t2.WHITESPACE_CELL_CHAR = " ", t2.WHITESPACE_CELL_WIDTH = 1, t2.WHITESPACE_CELL_CODE = 32;
    }, 4863: (e2, t2, i2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.Marker = undefined;
      const s2 = i2(8460), r = i2(844);

      class n {
        get id() {
          return this._id;
        }
        constructor(e3) {
          this.line = e3, this.isDisposed = false, this._disposables = [], this._id = n._nextId++, this._onDispose = this.register(new s2.EventEmitter), this.onDispose = this._onDispose.event;
        }
        dispose() {
          this.isDisposed || (this.isDisposed = true, this.line = -1, this._onDispose.fire(), (0, r.disposeArray)(this._disposables), this._disposables.length = 0);
        }
        register(e3) {
          return this._disposables.push(e3), e3;
        }
      }
      t2.Marker = n, n._nextId = 1;
    }, 7116: (e2, t2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.DEFAULT_CHARSET = t2.CHARSETS = undefined, t2.CHARSETS = {}, t2.DEFAULT_CHARSET = t2.CHARSETS.B, t2.CHARSETS[0] = { "`": "◆", a: "▒", b: "␉", c: "␌", d: "␍", e: "␊", f: "°", g: "±", h: "␤", i: "␋", j: "┘", k: "┐", l: "┌", m: "└", n: "┼", o: "⎺", p: "⎻", q: "─", r: "⎼", s: "⎽", t: "├", u: "┤", v: "┴", w: "┬", x: "│", y: "≤", z: "≥", "{": "π", "|": "≠", "}": "£", "~": "·" }, t2.CHARSETS.A = { "#": "£" }, t2.CHARSETS.B = undefined, t2.CHARSETS[4] = { "#": "£", "@": "¾", "[": "ij", "\\": "½", "]": "|", "{": "¨", "|": "f", "}": "¼", "~": "´" }, t2.CHARSETS.C = t2.CHARSETS[5] = { "[": "Ä", "\\": "Ö", "]": "Å", "^": "Ü", "`": "é", "{": "ä", "|": "ö", "}": "å", "~": "ü" }, t2.CHARSETS.R = { "#": "£", "@": "à", "[": "°", "\\": "ç", "]": "§", "{": "é", "|": "ù", "}": "è", "~": "¨" }, t2.CHARSETS.Q = { "@": "à", "[": "â", "\\": "ç", "]": "ê", "^": "î", "`": "ô", "{": "é", "|": "ù", "}": "è", "~": "û" }, t2.CHARSETS.K = { "@": "§", "[": "Ä", "\\": "Ö", "]": "Ü", "{": "ä", "|": "ö", "}": "ü", "~": "ß" }, t2.CHARSETS.Y = { "#": "£", "@": "§", "[": "°", "\\": "ç", "]": "é", "`": "ù", "{": "à", "|": "ò", "}": "è", "~": "ì" }, t2.CHARSETS.E = t2.CHARSETS[6] = { "@": "Ä", "[": "Æ", "\\": "Ø", "]": "Å", "^": "Ü", "`": "ä", "{": "æ", "|": "ø", "}": "å", "~": "ü" }, t2.CHARSETS.Z = { "#": "£", "@": "§", "[": "¡", "\\": "Ñ", "]": "¿", "{": "°", "|": "ñ", "}": "ç" }, t2.CHARSETS.H = t2.CHARSETS[7] = { "@": "É", "[": "Ä", "\\": "Ö", "]": "Å", "^": "Ü", "`": "é", "{": "ä", "|": "ö", "}": "å", "~": "ü" }, t2.CHARSETS["="] = { "#": "ù", "@": "à", "[": "é", "\\": "ç", "]": "ê", "^": "î", _: "è", "`": "ô", "{": "ä", "|": "ö", "}": "ü", "~": "û" };
    }, 2584: (e2, t2) => {
      var i2, s2, r;
      Object.defineProperty(t2, "__esModule", { value: true }), t2.C1_ESCAPED = t2.C1 = t2.C0 = undefined, function(e3) {
        e3.NUL = "\x00", e3.SOH = "\x01", e3.STX = "\x02", e3.ETX = "\x03", e3.EOT = "\x04", e3.ENQ = "\x05", e3.ACK = "\x06", e3.BEL = "\x07", e3.BS = "\b", e3.HT = "\t", e3.LF = `
`, e3.VT = "\v", e3.FF = "\f", e3.CR = "\r", e3.SO = "\x0E", e3.SI = "\x0F", e3.DLE = "\x10", e3.DC1 = "\x11", e3.DC2 = "\x12", e3.DC3 = "\x13", e3.DC4 = "\x14", e3.NAK = "\x15", e3.SYN = "\x16", e3.ETB = "\x17", e3.CAN = "\x18", e3.EM = "\x19", e3.SUB = "\x1A", e3.ESC = "\x1B", e3.FS = "\x1C", e3.GS = "\x1D", e3.RS = "\x1E", e3.US = "\x1F", e3.SP = " ", e3.DEL = "";
      }(i2 || (t2.C0 = i2 = {})), function(e3) {
        e3.PAD = "", e3.HOP = "", e3.BPH = "", e3.NBH = "", e3.IND = "", e3.NEL = "", e3.SSA = "", e3.ESA = "", e3.HTS = "", e3.HTJ = "", e3.VTS = "", e3.PLD = "", e3.PLU = "", e3.RI = "", e3.SS2 = "", e3.SS3 = "", e3.DCS = "", e3.PU1 = "", e3.PU2 = "", e3.STS = "", e3.CCH = "", e3.MW = "", e3.SPA = "", e3.EPA = "", e3.SOS = "", e3.SGCI = "", e3.SCI = "", e3.CSI = "", e3.ST = "", e3.OSC = "", e3.PM = "", e3.APC = "";
      }(s2 || (t2.C1 = s2 = {})), function(e3) {
        e3.ST = `${i2.ESC}\\`;
      }(r || (t2.C1_ESCAPED = r = {}));
    }, 7399: (e2, t2, i2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.evaluateKeyboardEvent = undefined;
      const s2 = i2(2584), r = { 48: ["0", ")"], 49: ["1", "!"], 50: ["2", "@"], 51: ["3", "#"], 52: ["4", "$"], 53: ["5", "%"], 54: ["6", "^"], 55: ["7", "&"], 56: ["8", "*"], 57: ["9", "("], 186: [";", ":"], 187: ["=", "+"], 188: [",", "<"], 189: ["-", "_"], 190: [".", ">"], 191: ["/", "?"], 192: ["`", "~"], 219: ["[", "{"], 220: ["\\", "|"], 221: ["]", "}"], 222: ["'", '"'] };
      t2.evaluateKeyboardEvent = function(e3, t3, i3, n) {
        const o = { type: 0, cancel: false, key: undefined }, a = (e3.shiftKey ? 1 : 0) | (e3.altKey ? 2 : 0) | (e3.ctrlKey ? 4 : 0) | (e3.metaKey ? 8 : 0);
        switch (e3.keyCode) {
          case 0:
            e3.key === "UIKeyInputUpArrow" ? o.key = t3 ? s2.C0.ESC + "OA" : s2.C0.ESC + "[A" : e3.key === "UIKeyInputLeftArrow" ? o.key = t3 ? s2.C0.ESC + "OD" : s2.C0.ESC + "[D" : e3.key === "UIKeyInputRightArrow" ? o.key = t3 ? s2.C0.ESC + "OC" : s2.C0.ESC + "[C" : e3.key === "UIKeyInputDownArrow" && (o.key = t3 ? s2.C0.ESC + "OB" : s2.C0.ESC + "[B");
            break;
          case 8:
            o.key = e3.ctrlKey ? "\b" : s2.C0.DEL, e3.altKey && (o.key = s2.C0.ESC + o.key);
            break;
          case 9:
            if (e3.shiftKey) {
              o.key = s2.C0.ESC + "[Z";
              break;
            }
            o.key = s2.C0.HT, o.cancel = true;
            break;
          case 13:
            o.key = e3.altKey ? s2.C0.ESC + s2.C0.CR : s2.C0.CR, o.cancel = true;
            break;
          case 27:
            o.key = s2.C0.ESC, e3.altKey && (o.key = s2.C0.ESC + s2.C0.ESC), o.cancel = true;
            break;
          case 37:
            if (e3.metaKey)
              break;
            a ? (o.key = s2.C0.ESC + "[1;" + (a + 1) + "D", o.key === s2.C0.ESC + "[1;3D" && (o.key = s2.C0.ESC + (i3 ? "b" : "[1;5D"))) : o.key = t3 ? s2.C0.ESC + "OD" : s2.C0.ESC + "[D";
            break;
          case 39:
            if (e3.metaKey)
              break;
            a ? (o.key = s2.C0.ESC + "[1;" + (a + 1) + "C", o.key === s2.C0.ESC + "[1;3C" && (o.key = s2.C0.ESC + (i3 ? "f" : "[1;5C"))) : o.key = t3 ? s2.C0.ESC + "OC" : s2.C0.ESC + "[C";
            break;
          case 38:
            if (e3.metaKey)
              break;
            a ? (o.key = s2.C0.ESC + "[1;" + (a + 1) + "A", i3 || o.key !== s2.C0.ESC + "[1;3A" || (o.key = s2.C0.ESC + "[1;5A")) : o.key = t3 ? s2.C0.ESC + "OA" : s2.C0.ESC + "[A";
            break;
          case 40:
            if (e3.metaKey)
              break;
            a ? (o.key = s2.C0.ESC + "[1;" + (a + 1) + "B", i3 || o.key !== s2.C0.ESC + "[1;3B" || (o.key = s2.C0.ESC + "[1;5B")) : o.key = t3 ? s2.C0.ESC + "OB" : s2.C0.ESC + "[B";
            break;
          case 45:
            e3.shiftKey || e3.ctrlKey || (o.key = s2.C0.ESC + "[2~");
            break;
          case 46:
            o.key = a ? s2.C0.ESC + "[3;" + (a + 1) + "~" : s2.C0.ESC + "[3~";
            break;
          case 36:
            o.key = a ? s2.C0.ESC + "[1;" + (a + 1) + "H" : t3 ? s2.C0.ESC + "OH" : s2.C0.ESC + "[H";
            break;
          case 35:
            o.key = a ? s2.C0.ESC + "[1;" + (a + 1) + "F" : t3 ? s2.C0.ESC + "OF" : s2.C0.ESC + "[F";
            break;
          case 33:
            e3.shiftKey ? o.type = 2 : e3.ctrlKey ? o.key = s2.C0.ESC + "[5;" + (a + 1) + "~" : o.key = s2.C0.ESC + "[5~";
            break;
          case 34:
            e3.shiftKey ? o.type = 3 : e3.ctrlKey ? o.key = s2.C0.ESC + "[6;" + (a + 1) + "~" : o.key = s2.C0.ESC + "[6~";
            break;
          case 112:
            o.key = a ? s2.C0.ESC + "[1;" + (a + 1) + "P" : s2.C0.ESC + "OP";
            break;
          case 113:
            o.key = a ? s2.C0.ESC + "[1;" + (a + 1) + "Q" : s2.C0.ESC + "OQ";
            break;
          case 114:
            o.key = a ? s2.C0.ESC + "[1;" + (a + 1) + "R" : s2.C0.ESC + "OR";
            break;
          case 115:
            o.key = a ? s2.C0.ESC + "[1;" + (a + 1) + "S" : s2.C0.ESC + "OS";
            break;
          case 116:
            o.key = a ? s2.C0.ESC + "[15;" + (a + 1) + "~" : s2.C0.ESC + "[15~";
            break;
          case 117:
            o.key = a ? s2.C0.ESC + "[17;" + (a + 1) + "~" : s2.C0.ESC + "[17~";
            break;
          case 118:
            o.key = a ? s2.C0.ESC + "[18;" + (a + 1) + "~" : s2.C0.ESC + "[18~";
            break;
          case 119:
            o.key = a ? s2.C0.ESC + "[19;" + (a + 1) + "~" : s2.C0.ESC + "[19~";
            break;
          case 120:
            o.key = a ? s2.C0.ESC + "[20;" + (a + 1) + "~" : s2.C0.ESC + "[20~";
            break;
          case 121:
            o.key = a ? s2.C0.ESC + "[21;" + (a + 1) + "~" : s2.C0.ESC + "[21~";
            break;
          case 122:
            o.key = a ? s2.C0.ESC + "[23;" + (a + 1) + "~" : s2.C0.ESC + "[23~";
            break;
          case 123:
            o.key = a ? s2.C0.ESC + "[24;" + (a + 1) + "~" : s2.C0.ESC + "[24~";
            break;
          default:
            if (!e3.ctrlKey || e3.shiftKey || e3.altKey || e3.metaKey)
              if (i3 && !n || !e3.altKey || e3.metaKey)
                !i3 || e3.altKey || e3.ctrlKey || e3.shiftKey || !e3.metaKey ? e3.key && !e3.ctrlKey && !e3.altKey && !e3.metaKey && e3.keyCode >= 48 && e3.key.length === 1 ? o.key = e3.key : e3.key && e3.ctrlKey && (e3.key === "_" && (o.key = s2.C0.US), e3.key === "@" && (o.key = s2.C0.NUL)) : e3.keyCode === 65 && (o.type = 1);
              else {
                const t4 = r[e3.keyCode], i4 = t4?.[e3.shiftKey ? 1 : 0];
                if (i4)
                  o.key = s2.C0.ESC + i4;
                else if (e3.keyCode >= 65 && e3.keyCode <= 90) {
                  const t5 = e3.ctrlKey ? e3.keyCode - 64 : e3.keyCode + 32;
                  let i5 = String.fromCharCode(t5);
                  e3.shiftKey && (i5 = i5.toUpperCase()), o.key = s2.C0.ESC + i5;
                } else if (e3.keyCode === 32)
                  o.key = s2.C0.ESC + (e3.ctrlKey ? s2.C0.NUL : " ");
                else if (e3.key === "Dead" && e3.code.startsWith("Key")) {
                  let t5 = e3.code.slice(3, 4);
                  e3.shiftKey || (t5 = t5.toLowerCase()), o.key = s2.C0.ESC + t5, o.cancel = true;
                }
              }
            else
              e3.keyCode >= 65 && e3.keyCode <= 90 ? o.key = String.fromCharCode(e3.keyCode - 64) : e3.keyCode === 32 ? o.key = s2.C0.NUL : e3.keyCode >= 51 && e3.keyCode <= 55 ? o.key = String.fromCharCode(e3.keyCode - 51 + 27) : e3.keyCode === 56 ? o.key = s2.C0.DEL : e3.keyCode === 219 ? o.key = s2.C0.ESC : e3.keyCode === 220 ? o.key = s2.C0.FS : e3.keyCode === 221 && (o.key = s2.C0.GS);
        }
        return o;
      };
    }, 482: (e2, t2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.Utf8ToUtf32 = t2.StringToUtf32 = t2.utf32ToString = t2.stringFromCodePoint = undefined, t2.stringFromCodePoint = function(e3) {
        return e3 > 65535 ? (e3 -= 65536, String.fromCharCode(55296 + (e3 >> 10)) + String.fromCharCode(e3 % 1024 + 56320)) : String.fromCharCode(e3);
      }, t2.utf32ToString = function(e3, t3 = 0, i2 = e3.length) {
        let s2 = "";
        for (let r = t3;r < i2; ++r) {
          let t4 = e3[r];
          t4 > 65535 ? (t4 -= 65536, s2 += String.fromCharCode(55296 + (t4 >> 10)) + String.fromCharCode(t4 % 1024 + 56320)) : s2 += String.fromCharCode(t4);
        }
        return s2;
      }, t2.StringToUtf32 = class {
        constructor() {
          this._interim = 0;
        }
        clear() {
          this._interim = 0;
        }
        decode(e3, t3) {
          const i2 = e3.length;
          if (!i2)
            return 0;
          let s2 = 0, r = 0;
          if (this._interim) {
            const i3 = e3.charCodeAt(r++);
            56320 <= i3 && i3 <= 57343 ? t3[s2++] = 1024 * (this._interim - 55296) + i3 - 56320 + 65536 : (t3[s2++] = this._interim, t3[s2++] = i3), this._interim = 0;
          }
          for (let n = r;n < i2; ++n) {
            const r2 = e3.charCodeAt(n);
            if (55296 <= r2 && r2 <= 56319) {
              if (++n >= i2)
                return this._interim = r2, s2;
              const o = e3.charCodeAt(n);
              56320 <= o && o <= 57343 ? t3[s2++] = 1024 * (r2 - 55296) + o - 56320 + 65536 : (t3[s2++] = r2, t3[s2++] = o);
            } else
              r2 !== 65279 && (t3[s2++] = r2);
          }
          return s2;
        }
      }, t2.Utf8ToUtf32 = class {
        constructor() {
          this.interim = new Uint8Array(3);
        }
        clear() {
          this.interim.fill(0);
        }
        decode(e3, t3) {
          const i2 = e3.length;
          if (!i2)
            return 0;
          let s2, r, n, o, a = 0, h = 0, c = 0;
          if (this.interim[0]) {
            let s3 = false, r2 = this.interim[0];
            r2 &= (224 & r2) == 192 ? 31 : (240 & r2) == 224 ? 15 : 7;
            let n2, o2 = 0;
            for (;(n2 = 63 & this.interim[++o2]) && o2 < 4; )
              r2 <<= 6, r2 |= n2;
            const h2 = (224 & this.interim[0]) == 192 ? 2 : (240 & this.interim[0]) == 224 ? 3 : 4, l2 = h2 - o2;
            for (;c < l2; ) {
              if (c >= i2)
                return 0;
              if (n2 = e3[c++], (192 & n2) != 128) {
                c--, s3 = true;
                break;
              }
              this.interim[o2++] = n2, r2 <<= 6, r2 |= 63 & n2;
            }
            s3 || (h2 === 2 ? r2 < 128 ? c-- : t3[a++] = r2 : h2 === 3 ? r2 < 2048 || r2 >= 55296 && r2 <= 57343 || r2 === 65279 || (t3[a++] = r2) : r2 < 65536 || r2 > 1114111 || (t3[a++] = r2)), this.interim.fill(0);
          }
          const l = i2 - 4;
          let d = c;
          for (;d < i2; ) {
            for (;!(!(d < l) || 128 & (s2 = e3[d]) || 128 & (r = e3[d + 1]) || 128 & (n = e3[d + 2]) || 128 & (o = e3[d + 3])); )
              t3[a++] = s2, t3[a++] = r, t3[a++] = n, t3[a++] = o, d += 4;
            if (s2 = e3[d++], s2 < 128)
              t3[a++] = s2;
            else if ((224 & s2) == 192) {
              if (d >= i2)
                return this.interim[0] = s2, a;
              if (r = e3[d++], (192 & r) != 128) {
                d--;
                continue;
              }
              if (h = (31 & s2) << 6 | 63 & r, h < 128) {
                d--;
                continue;
              }
              t3[a++] = h;
            } else if ((240 & s2) == 224) {
              if (d >= i2)
                return this.interim[0] = s2, a;
              if (r = e3[d++], (192 & r) != 128) {
                d--;
                continue;
              }
              if (d >= i2)
                return this.interim[0] = s2, this.interim[1] = r, a;
              if (n = e3[d++], (192 & n) != 128) {
                d--;
                continue;
              }
              if (h = (15 & s2) << 12 | (63 & r) << 6 | 63 & n, h < 2048 || h >= 55296 && h <= 57343 || h === 65279)
                continue;
              t3[a++] = h;
            } else if ((248 & s2) == 240) {
              if (d >= i2)
                return this.interim[0] = s2, a;
              if (r = e3[d++], (192 & r) != 128) {
                d--;
                continue;
              }
              if (d >= i2)
                return this.interim[0] = s2, this.interim[1] = r, a;
              if (n = e3[d++], (192 & n) != 128) {
                d--;
                continue;
              }
              if (d >= i2)
                return this.interim[0] = s2, this.interim[1] = r, this.interim[2] = n, a;
              if (o = e3[d++], (192 & o) != 128) {
                d--;
                continue;
              }
              if (h = (7 & s2) << 18 | (63 & r) << 12 | (63 & n) << 6 | 63 & o, h < 65536 || h > 1114111)
                continue;
              t3[a++] = h;
            }
          }
          return a;
        }
      };
    }, 225: (e2, t2, i2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.UnicodeV6 = undefined;
      const s2 = i2(1480), r = [[768, 879], [1155, 1158], [1160, 1161], [1425, 1469], [1471, 1471], [1473, 1474], [1476, 1477], [1479, 1479], [1536, 1539], [1552, 1557], [1611, 1630], [1648, 1648], [1750, 1764], [1767, 1768], [1770, 1773], [1807, 1807], [1809, 1809], [1840, 1866], [1958, 1968], [2027, 2035], [2305, 2306], [2364, 2364], [2369, 2376], [2381, 2381], [2385, 2388], [2402, 2403], [2433, 2433], [2492, 2492], [2497, 2500], [2509, 2509], [2530, 2531], [2561, 2562], [2620, 2620], [2625, 2626], [2631, 2632], [2635, 2637], [2672, 2673], [2689, 2690], [2748, 2748], [2753, 2757], [2759, 2760], [2765, 2765], [2786, 2787], [2817, 2817], [2876, 2876], [2879, 2879], [2881, 2883], [2893, 2893], [2902, 2902], [2946, 2946], [3008, 3008], [3021, 3021], [3134, 3136], [3142, 3144], [3146, 3149], [3157, 3158], [3260, 3260], [3263, 3263], [3270, 3270], [3276, 3277], [3298, 3299], [3393, 3395], [3405, 3405], [3530, 3530], [3538, 3540], [3542, 3542], [3633, 3633], [3636, 3642], [3655, 3662], [3761, 3761], [3764, 3769], [3771, 3772], [3784, 3789], [3864, 3865], [3893, 3893], [3895, 3895], [3897, 3897], [3953, 3966], [3968, 3972], [3974, 3975], [3984, 3991], [3993, 4028], [4038, 4038], [4141, 4144], [4146, 4146], [4150, 4151], [4153, 4153], [4184, 4185], [4448, 4607], [4959, 4959], [5906, 5908], [5938, 5940], [5970, 5971], [6002, 6003], [6068, 6069], [6071, 6077], [6086, 6086], [6089, 6099], [6109, 6109], [6155, 6157], [6313, 6313], [6432, 6434], [6439, 6440], [6450, 6450], [6457, 6459], [6679, 6680], [6912, 6915], [6964, 6964], [6966, 6970], [6972, 6972], [6978, 6978], [7019, 7027], [7616, 7626], [7678, 7679], [8203, 8207], [8234, 8238], [8288, 8291], [8298, 8303], [8400, 8431], [12330, 12335], [12441, 12442], [43014, 43014], [43019, 43019], [43045, 43046], [64286, 64286], [65024, 65039], [65056, 65059], [65279, 65279], [65529, 65531]], n = [[68097, 68099], [68101, 68102], [68108, 68111], [68152, 68154], [68159, 68159], [119143, 119145], [119155, 119170], [119173, 119179], [119210, 119213], [119362, 119364], [917505, 917505], [917536, 917631], [917760, 917999]];
      let o;
      t2.UnicodeV6 = class {
        constructor() {
          if (this.version = "6", !o) {
            o = new Uint8Array(65536), o.fill(1), o[0] = 0, o.fill(0, 1, 32), o.fill(0, 127, 160), o.fill(2, 4352, 4448), o[9001] = 2, o[9002] = 2, o.fill(2, 11904, 42192), o[12351] = 1, o.fill(2, 44032, 55204), o.fill(2, 63744, 64256), o.fill(2, 65040, 65050), o.fill(2, 65072, 65136), o.fill(2, 65280, 65377), o.fill(2, 65504, 65511);
            for (let e3 = 0;e3 < r.length; ++e3)
              o.fill(0, r[e3][0], r[e3][1] + 1);
          }
        }
        wcwidth(e3) {
          return e3 < 32 ? 0 : e3 < 127 ? 1 : e3 < 65536 ? o[e3] : function(e4, t3) {
            let i3, s3 = 0, r2 = t3.length - 1;
            if (e4 < t3[0][0] || e4 > t3[r2][1])
              return false;
            for (;r2 >= s3; )
              if (i3 = s3 + r2 >> 1, e4 > t3[i3][1])
                s3 = i3 + 1;
              else {
                if (!(e4 < t3[i3][0]))
                  return true;
                r2 = i3 - 1;
              }
            return false;
          }(e3, n) ? 0 : e3 >= 131072 && e3 <= 196605 || e3 >= 196608 && e3 <= 262141 ? 2 : 1;
        }
        charProperties(e3, t3) {
          let i3 = this.wcwidth(e3), r2 = i3 === 0 && t3 !== 0;
          if (r2) {
            const e4 = s2.UnicodeService.extractWidth(t3);
            e4 === 0 ? r2 = false : e4 > i3 && (i3 = e4);
          }
          return s2.UnicodeService.createPropertyValue(0, i3, r2);
        }
      };
    }, 5981: (e2, t2, i2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.WriteBuffer = undefined;
      const s2 = i2(8460), r = i2(844);

      class n extends r.Disposable {
        constructor(e3) {
          super(), this._action = e3, this._writeBuffer = [], this._callbacks = [], this._pendingData = 0, this._bufferOffset = 0, this._isSyncWriting = false, this._syncCalls = 0, this._didUserInput = false, this._onWriteParsed = this.register(new s2.EventEmitter), this.onWriteParsed = this._onWriteParsed.event;
        }
        handleUserInput() {
          this._didUserInput = true;
        }
        writeSync(e3, t3) {
          if (t3 !== undefined && this._syncCalls > t3)
            return void (this._syncCalls = 0);
          if (this._pendingData += e3.length, this._writeBuffer.push(e3), this._callbacks.push(undefined), this._syncCalls++, this._isSyncWriting)
            return;
          let i3;
          for (this._isSyncWriting = true;i3 = this._writeBuffer.shift(); ) {
            this._action(i3);
            const e4 = this._callbacks.shift();
            e4 && e4();
          }
          this._pendingData = 0, this._bufferOffset = 2147483647, this._isSyncWriting = false, this._syncCalls = 0;
        }
        write(e3, t3) {
          if (this._pendingData > 50000000)
            throw new Error("write data discarded, use flow control to avoid losing data");
          if (!this._writeBuffer.length) {
            if (this._bufferOffset = 0, this._didUserInput)
              return this._didUserInput = false, this._pendingData += e3.length, this._writeBuffer.push(e3), this._callbacks.push(t3), void this._innerWrite();
            setTimeout(() => this._innerWrite());
          }
          this._pendingData += e3.length, this._writeBuffer.push(e3), this._callbacks.push(t3);
        }
        _innerWrite(e3 = 0, t3 = true) {
          const i3 = e3 || Date.now();
          for (;this._writeBuffer.length > this._bufferOffset; ) {
            const e4 = this._writeBuffer[this._bufferOffset], s3 = this._action(e4, t3);
            if (s3) {
              const e5 = (e6) => Date.now() - i3 >= 12 ? setTimeout(() => this._innerWrite(0, e6)) : this._innerWrite(i3, e6);
              return void s3.catch((e6) => (queueMicrotask(() => {
                throw e6;
              }), Promise.resolve(false))).then(e5);
            }
            const r2 = this._callbacks[this._bufferOffset];
            if (r2 && r2(), this._bufferOffset++, this._pendingData -= e4.length, Date.now() - i3 >= 12)
              break;
          }
          this._writeBuffer.length > this._bufferOffset ? (this._bufferOffset > 50 && (this._writeBuffer = this._writeBuffer.slice(this._bufferOffset), this._callbacks = this._callbacks.slice(this._bufferOffset), this._bufferOffset = 0), setTimeout(() => this._innerWrite())) : (this._writeBuffer.length = 0, this._callbacks.length = 0, this._pendingData = 0, this._bufferOffset = 0), this._onWriteParsed.fire();
        }
      }
      t2.WriteBuffer = n;
    }, 5941: (e2, t2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.toRgbString = t2.parseColor = undefined;
      const i2 = /^([\da-f])\/([\da-f])\/([\da-f])$|^([\da-f]{2})\/([\da-f]{2})\/([\da-f]{2})$|^([\da-f]{3})\/([\da-f]{3})\/([\da-f]{3})$|^([\da-f]{4})\/([\da-f]{4})\/([\da-f]{4})$/, s2 = /^[\da-f]+$/;
      function r(e3, t3) {
        const i3 = e3.toString(16), s3 = i3.length < 2 ? "0" + i3 : i3;
        switch (t3) {
          case 4:
            return i3[0];
          case 8:
            return s3;
          case 12:
            return (s3 + s3).slice(0, 3);
          default:
            return s3 + s3;
        }
      }
      t2.parseColor = function(e3) {
        if (!e3)
          return;
        let t3 = e3.toLowerCase();
        if (t3.indexOf("rgb:") === 0) {
          t3 = t3.slice(4);
          const e4 = i2.exec(t3);
          if (e4) {
            const t4 = e4[1] ? 15 : e4[4] ? 255 : e4[7] ? 4095 : 65535;
            return [Math.round(parseInt(e4[1] || e4[4] || e4[7] || e4[10], 16) / t4 * 255), Math.round(parseInt(e4[2] || e4[5] || e4[8] || e4[11], 16) / t4 * 255), Math.round(parseInt(e4[3] || e4[6] || e4[9] || e4[12], 16) / t4 * 255)];
          }
        } else if (t3.indexOf("#") === 0 && (t3 = t3.slice(1), s2.exec(t3) && [3, 6, 9, 12].includes(t3.length))) {
          const e4 = t3.length / 3, i3 = [0, 0, 0];
          for (let s3 = 0;s3 < 3; ++s3) {
            const r2 = parseInt(t3.slice(e4 * s3, e4 * s3 + e4), 16);
            i3[s3] = e4 === 1 ? r2 << 4 : e4 === 2 ? r2 : e4 === 3 ? r2 >> 4 : r2 >> 8;
          }
          return i3;
        }
      }, t2.toRgbString = function(e3, t3 = 16) {
        const [i3, s3, n] = e3;
        return `rgb:${r(i3, t3)}/${r(s3, t3)}/${r(n, t3)}`;
      };
    }, 5770: (e2, t2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.PAYLOAD_LIMIT = undefined, t2.PAYLOAD_LIMIT = 1e7;
    }, 6351: (e2, t2, i2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.DcsHandler = t2.DcsParser = undefined;
      const s2 = i2(482), r = i2(8742), n = i2(5770), o = [];
      t2.DcsParser = class {
        constructor() {
          this._handlers = Object.create(null), this._active = o, this._ident = 0, this._handlerFb = () => {}, this._stack = { paused: false, loopPosition: 0, fallThrough: false };
        }
        dispose() {
          this._handlers = Object.create(null), this._handlerFb = () => {}, this._active = o;
        }
        registerHandler(e3, t3) {
          this._handlers[e3] === undefined && (this._handlers[e3] = []);
          const i3 = this._handlers[e3];
          return i3.push(t3), { dispose: () => {
            const e4 = i3.indexOf(t3);
            e4 !== -1 && i3.splice(e4, 1);
          } };
        }
        clearHandler(e3) {
          this._handlers[e3] && delete this._handlers[e3];
        }
        setHandlerFallback(e3) {
          this._handlerFb = e3;
        }
        reset() {
          if (this._active.length)
            for (let e3 = this._stack.paused ? this._stack.loopPosition - 1 : this._active.length - 1;e3 >= 0; --e3)
              this._active[e3].unhook(false);
          this._stack.paused = false, this._active = o, this._ident = 0;
        }
        hook(e3, t3) {
          if (this.reset(), this._ident = e3, this._active = this._handlers[e3] || o, this._active.length)
            for (let e4 = this._active.length - 1;e4 >= 0; e4--)
              this._active[e4].hook(t3);
          else
            this._handlerFb(this._ident, "HOOK", t3);
        }
        put(e3, t3, i3) {
          if (this._active.length)
            for (let s3 = this._active.length - 1;s3 >= 0; s3--)
              this._active[s3].put(e3, t3, i3);
          else
            this._handlerFb(this._ident, "PUT", (0, s2.utf32ToString)(e3, t3, i3));
        }
        unhook(e3, t3 = true) {
          if (this._active.length) {
            let i3 = false, s3 = this._active.length - 1, r2 = false;
            if (this._stack.paused && (s3 = this._stack.loopPosition - 1, i3 = t3, r2 = this._stack.fallThrough, this._stack.paused = false), !r2 && i3 === false) {
              for (;s3 >= 0 && (i3 = this._active[s3].unhook(e3), i3 !== true); s3--)
                if (i3 instanceof Promise)
                  return this._stack.paused = true, this._stack.loopPosition = s3, this._stack.fallThrough = false, i3;
              s3--;
            }
            for (;s3 >= 0; s3--)
              if (i3 = this._active[s3].unhook(false), i3 instanceof Promise)
                return this._stack.paused = true, this._stack.loopPosition = s3, this._stack.fallThrough = true, i3;
          } else
            this._handlerFb(this._ident, "UNHOOK", e3);
          this._active = o, this._ident = 0;
        }
      };
      const a = new r.Params;
      a.addParam(0), t2.DcsHandler = class {
        constructor(e3) {
          this._handler = e3, this._data = "", this._params = a, this._hitLimit = false;
        }
        hook(e3) {
          this._params = e3.length > 1 || e3.params[0] ? e3.clone() : a, this._data = "", this._hitLimit = false;
        }
        put(e3, t3, i3) {
          this._hitLimit || (this._data += (0, s2.utf32ToString)(e3, t3, i3), this._data.length > n.PAYLOAD_LIMIT && (this._data = "", this._hitLimit = true));
        }
        unhook(e3) {
          let t3 = false;
          if (this._hitLimit)
            t3 = false;
          else if (e3 && (t3 = this._handler(this._data, this._params), t3 instanceof Promise))
            return t3.then((e4) => (this._params = a, this._data = "", this._hitLimit = false, e4));
          return this._params = a, this._data = "", this._hitLimit = false, t3;
        }
      };
    }, 2015: (e2, t2, i2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.EscapeSequenceParser = t2.VT500_TRANSITION_TABLE = t2.TransitionTable = undefined;
      const s2 = i2(844), r = i2(8742), n = i2(6242), o = i2(6351);

      class a {
        constructor(e3) {
          this.table = new Uint8Array(e3);
        }
        setDefault(e3, t3) {
          this.table.fill(e3 << 4 | t3);
        }
        add(e3, t3, i3, s3) {
          this.table[t3 << 8 | e3] = i3 << 4 | s3;
        }
        addMany(e3, t3, i3, s3) {
          for (let r2 = 0;r2 < e3.length; r2++)
            this.table[t3 << 8 | e3[r2]] = i3 << 4 | s3;
        }
      }
      t2.TransitionTable = a;
      const h = 160;
      t2.VT500_TRANSITION_TABLE = function() {
        const e3 = new a(4095), t3 = Array.apply(null, Array(256)).map((e4, t4) => t4), i3 = (e4, i4) => t3.slice(e4, i4), s3 = i3(32, 127), r2 = i3(0, 24);
        r2.push(25), r2.push.apply(r2, i3(28, 32));
        const n2 = i3(0, 14);
        let o2;
        for (o2 in e3.setDefault(1, 0), e3.addMany(s3, 0, 2, 0), n2)
          e3.addMany([24, 26, 153, 154], o2, 3, 0), e3.addMany(i3(128, 144), o2, 3, 0), e3.addMany(i3(144, 152), o2, 3, 0), e3.add(156, o2, 0, 0), e3.add(27, o2, 11, 1), e3.add(157, o2, 4, 8), e3.addMany([152, 158, 159], o2, 0, 7), e3.add(155, o2, 11, 3), e3.add(144, o2, 11, 9);
        return e3.addMany(r2, 0, 3, 0), e3.addMany(r2, 1, 3, 1), e3.add(127, 1, 0, 1), e3.addMany(r2, 8, 0, 8), e3.addMany(r2, 3, 3, 3), e3.add(127, 3, 0, 3), e3.addMany(r2, 4, 3, 4), e3.add(127, 4, 0, 4), e3.addMany(r2, 6, 3, 6), e3.addMany(r2, 5, 3, 5), e3.add(127, 5, 0, 5), e3.addMany(r2, 2, 3, 2), e3.add(127, 2, 0, 2), e3.add(93, 1, 4, 8), e3.addMany(s3, 8, 5, 8), e3.add(127, 8, 5, 8), e3.addMany([156, 27, 24, 26, 7], 8, 6, 0), e3.addMany(i3(28, 32), 8, 0, 8), e3.addMany([88, 94, 95], 1, 0, 7), e3.addMany(s3, 7, 0, 7), e3.addMany(r2, 7, 0, 7), e3.add(156, 7, 0, 0), e3.add(127, 7, 0, 7), e3.add(91, 1, 11, 3), e3.addMany(i3(64, 127), 3, 7, 0), e3.addMany(i3(48, 60), 3, 8, 4), e3.addMany([60, 61, 62, 63], 3, 9, 4), e3.addMany(i3(48, 60), 4, 8, 4), e3.addMany(i3(64, 127), 4, 7, 0), e3.addMany([60, 61, 62, 63], 4, 0, 6), e3.addMany(i3(32, 64), 6, 0, 6), e3.add(127, 6, 0, 6), e3.addMany(i3(64, 127), 6, 0, 0), e3.addMany(i3(32, 48), 3, 9, 5), e3.addMany(i3(32, 48), 5, 9, 5), e3.addMany(i3(48, 64), 5, 0, 6), e3.addMany(i3(64, 127), 5, 7, 0), e3.addMany(i3(32, 48), 4, 9, 5), e3.addMany(i3(32, 48), 1, 9, 2), e3.addMany(i3(32, 48), 2, 9, 2), e3.addMany(i3(48, 127), 2, 10, 0), e3.addMany(i3(48, 80), 1, 10, 0), e3.addMany(i3(81, 88), 1, 10, 0), e3.addMany([89, 90, 92], 1, 10, 0), e3.addMany(i3(96, 127), 1, 10, 0), e3.add(80, 1, 11, 9), e3.addMany(r2, 9, 0, 9), e3.add(127, 9, 0, 9), e3.addMany(i3(28, 32), 9, 0, 9), e3.addMany(i3(32, 48), 9, 9, 12), e3.addMany(i3(48, 60), 9, 8, 10), e3.addMany([60, 61, 62, 63], 9, 9, 10), e3.addMany(r2, 11, 0, 11), e3.addMany(i3(32, 128), 11, 0, 11), e3.addMany(i3(28, 32), 11, 0, 11), e3.addMany(r2, 10, 0, 10), e3.add(127, 10, 0, 10), e3.addMany(i3(28, 32), 10, 0, 10), e3.addMany(i3(48, 60), 10, 8, 10), e3.addMany([60, 61, 62, 63], 10, 0, 11), e3.addMany(i3(32, 48), 10, 9, 12), e3.addMany(r2, 12, 0, 12), e3.add(127, 12, 0, 12), e3.addMany(i3(28, 32), 12, 0, 12), e3.addMany(i3(32, 48), 12, 9, 12), e3.addMany(i3(48, 64), 12, 0, 11), e3.addMany(i3(64, 127), 12, 12, 13), e3.addMany(i3(64, 127), 10, 12, 13), e3.addMany(i3(64, 127), 9, 12, 13), e3.addMany(r2, 13, 13, 13), e3.addMany(s3, 13, 13, 13), e3.add(127, 13, 0, 13), e3.addMany([27, 156, 24, 26], 13, 14, 0), e3.add(h, 0, 2, 0), e3.add(h, 8, 5, 8), e3.add(h, 6, 0, 6), e3.add(h, 11, 0, 11), e3.add(h, 13, 13, 13), e3;
      }();

      class c extends s2.Disposable {
        constructor(e3 = t2.VT500_TRANSITION_TABLE) {
          super(), this._transitions = e3, this._parseStack = { state: 0, handlers: [], handlerPos: 0, transition: 0, chunkPos: 0 }, this.initialState = 0, this.currentState = this.initialState, this._params = new r.Params, this._params.addParam(0), this._collect = 0, this.precedingJoinState = 0, this._printHandlerFb = (e4, t3, i3) => {}, this._executeHandlerFb = (e4) => {}, this._csiHandlerFb = (e4, t3) => {}, this._escHandlerFb = (e4) => {}, this._errorHandlerFb = (e4) => e4, this._printHandler = this._printHandlerFb, this._executeHandlers = Object.create(null), this._csiHandlers = Object.create(null), this._escHandlers = Object.create(null), this.register((0, s2.toDisposable)(() => {
            this._csiHandlers = Object.create(null), this._executeHandlers = Object.create(null), this._escHandlers = Object.create(null);
          })), this._oscParser = this.register(new n.OscParser), this._dcsParser = this.register(new o.DcsParser), this._errorHandler = this._errorHandlerFb, this.registerEscHandler({ final: "\\" }, () => true);
        }
        _identifier(e3, t3 = [64, 126]) {
          let i3 = 0;
          if (e3.prefix) {
            if (e3.prefix.length > 1)
              throw new Error("only one byte as prefix supported");
            if (i3 = e3.prefix.charCodeAt(0), i3 && 60 > i3 || i3 > 63)
              throw new Error("prefix must be in range 0x3c .. 0x3f");
          }
          if (e3.intermediates) {
            if (e3.intermediates.length > 2)
              throw new Error("only two bytes as intermediates are supported");
            for (let t4 = 0;t4 < e3.intermediates.length; ++t4) {
              const s4 = e3.intermediates.charCodeAt(t4);
              if (32 > s4 || s4 > 47)
                throw new Error("intermediate must be in range 0x20 .. 0x2f");
              i3 <<= 8, i3 |= s4;
            }
          }
          if (e3.final.length !== 1)
            throw new Error("final must be a single byte");
          const s3 = e3.final.charCodeAt(0);
          if (t3[0] > s3 || s3 > t3[1])
            throw new Error(`final must be in range ${t3[0]} .. ${t3[1]}`);
          return i3 <<= 8, i3 |= s3, i3;
        }
        identToString(e3) {
          const t3 = [];
          for (;e3; )
            t3.push(String.fromCharCode(255 & e3)), e3 >>= 8;
          return t3.reverse().join("");
        }
        setPrintHandler(e3) {
          this._printHandler = e3;
        }
        clearPrintHandler() {
          this._printHandler = this._printHandlerFb;
        }
        registerEscHandler(e3, t3) {
          const i3 = this._identifier(e3, [48, 126]);
          this._escHandlers[i3] === undefined && (this._escHandlers[i3] = []);
          const s3 = this._escHandlers[i3];
          return s3.push(t3), { dispose: () => {
            const e4 = s3.indexOf(t3);
            e4 !== -1 && s3.splice(e4, 1);
          } };
        }
        clearEscHandler(e3) {
          this._escHandlers[this._identifier(e3, [48, 126])] && delete this._escHandlers[this._identifier(e3, [48, 126])];
        }
        setEscHandlerFallback(e3) {
          this._escHandlerFb = e3;
        }
        setExecuteHandler(e3, t3) {
          this._executeHandlers[e3.charCodeAt(0)] = t3;
        }
        clearExecuteHandler(e3) {
          this._executeHandlers[e3.charCodeAt(0)] && delete this._executeHandlers[e3.charCodeAt(0)];
        }
        setExecuteHandlerFallback(e3) {
          this._executeHandlerFb = e3;
        }
        registerCsiHandler(e3, t3) {
          const i3 = this._identifier(e3);
          this._csiHandlers[i3] === undefined && (this._csiHandlers[i3] = []);
          const s3 = this._csiHandlers[i3];
          return s3.push(t3), { dispose: () => {
            const e4 = s3.indexOf(t3);
            e4 !== -1 && s3.splice(e4, 1);
          } };
        }
        clearCsiHandler(e3) {
          this._csiHandlers[this._identifier(e3)] && delete this._csiHandlers[this._identifier(e3)];
        }
        setCsiHandlerFallback(e3) {
          this._csiHandlerFb = e3;
        }
        registerDcsHandler(e3, t3) {
          return this._dcsParser.registerHandler(this._identifier(e3), t3);
        }
        clearDcsHandler(e3) {
          this._dcsParser.clearHandler(this._identifier(e3));
        }
        setDcsHandlerFallback(e3) {
          this._dcsParser.setHandlerFallback(e3);
        }
        registerOscHandler(e3, t3) {
          return this._oscParser.registerHandler(e3, t3);
        }
        clearOscHandler(e3) {
          this._oscParser.clearHandler(e3);
        }
        setOscHandlerFallback(e3) {
          this._oscParser.setHandlerFallback(e3);
        }
        setErrorHandler(e3) {
          this._errorHandler = e3;
        }
        clearErrorHandler() {
          this._errorHandler = this._errorHandlerFb;
        }
        reset() {
          this.currentState = this.initialState, this._oscParser.reset(), this._dcsParser.reset(), this._params.reset(), this._params.addParam(0), this._collect = 0, this.precedingJoinState = 0, this._parseStack.state !== 0 && (this._parseStack.state = 2, this._parseStack.handlers = []);
        }
        _preserveStack(e3, t3, i3, s3, r2) {
          this._parseStack.state = e3, this._parseStack.handlers = t3, this._parseStack.handlerPos = i3, this._parseStack.transition = s3, this._parseStack.chunkPos = r2;
        }
        parse(e3, t3, i3) {
          let s3, r2 = 0, n2 = 0, o2 = 0;
          if (this._parseStack.state)
            if (this._parseStack.state === 2)
              this._parseStack.state = 0, o2 = this._parseStack.chunkPos + 1;
            else {
              if (i3 === undefined || this._parseStack.state === 1)
                throw this._parseStack.state = 1, new Error("improper continuation due to previous async handler, giving up parsing");
              const t4 = this._parseStack.handlers;
              let n3 = this._parseStack.handlerPos - 1;
              switch (this._parseStack.state) {
                case 3:
                  if (i3 === false && n3 > -1) {
                    for (;n3 >= 0 && (s3 = t4[n3](this._params), s3 !== true); n3--)
                      if (s3 instanceof Promise)
                        return this._parseStack.handlerPos = n3, s3;
                  }
                  this._parseStack.handlers = [];
                  break;
                case 4:
                  if (i3 === false && n3 > -1) {
                    for (;n3 >= 0 && (s3 = t4[n3](), s3 !== true); n3--)
                      if (s3 instanceof Promise)
                        return this._parseStack.handlerPos = n3, s3;
                  }
                  this._parseStack.handlers = [];
                  break;
                case 6:
                  if (r2 = e3[this._parseStack.chunkPos], s3 = this._dcsParser.unhook(r2 !== 24 && r2 !== 26, i3), s3)
                    return s3;
                  r2 === 27 && (this._parseStack.transition |= 1), this._params.reset(), this._params.addParam(0), this._collect = 0;
                  break;
                case 5:
                  if (r2 = e3[this._parseStack.chunkPos], s3 = this._oscParser.end(r2 !== 24 && r2 !== 26, i3), s3)
                    return s3;
                  r2 === 27 && (this._parseStack.transition |= 1), this._params.reset(), this._params.addParam(0), this._collect = 0;
              }
              this._parseStack.state = 0, o2 = this._parseStack.chunkPos + 1, this.precedingJoinState = 0, this.currentState = 15 & this._parseStack.transition;
            }
          for (let i4 = o2;i4 < t3; ++i4) {
            switch (r2 = e3[i4], n2 = this._transitions.table[this.currentState << 8 | (r2 < 160 ? r2 : h)], n2 >> 4) {
              case 2:
                for (let s4 = i4 + 1;; ++s4) {
                  if (s4 >= t3 || (r2 = e3[s4]) < 32 || r2 > 126 && r2 < h) {
                    this._printHandler(e3, i4, s4), i4 = s4 - 1;
                    break;
                  }
                  if (++s4 >= t3 || (r2 = e3[s4]) < 32 || r2 > 126 && r2 < h) {
                    this._printHandler(e3, i4, s4), i4 = s4 - 1;
                    break;
                  }
                  if (++s4 >= t3 || (r2 = e3[s4]) < 32 || r2 > 126 && r2 < h) {
                    this._printHandler(e3, i4, s4), i4 = s4 - 1;
                    break;
                  }
                  if (++s4 >= t3 || (r2 = e3[s4]) < 32 || r2 > 126 && r2 < h) {
                    this._printHandler(e3, i4, s4), i4 = s4 - 1;
                    break;
                  }
                }
                break;
              case 3:
                this._executeHandlers[r2] ? this._executeHandlers[r2]() : this._executeHandlerFb(r2), this.precedingJoinState = 0;
                break;
              case 0:
                break;
              case 1:
                if (this._errorHandler({ position: i4, code: r2, currentState: this.currentState, collect: this._collect, params: this._params, abort: false }).abort)
                  return;
                break;
              case 7:
                const o3 = this._csiHandlers[this._collect << 8 | r2];
                let a2 = o3 ? o3.length - 1 : -1;
                for (;a2 >= 0 && (s3 = o3[a2](this._params), s3 !== true); a2--)
                  if (s3 instanceof Promise)
                    return this._preserveStack(3, o3, a2, n2, i4), s3;
                a2 < 0 && this._csiHandlerFb(this._collect << 8 | r2, this._params), this.precedingJoinState = 0;
                break;
              case 8:
                do {
                  switch (r2) {
                    case 59:
                      this._params.addParam(0);
                      break;
                    case 58:
                      this._params.addSubParam(-1);
                      break;
                    default:
                      this._params.addDigit(r2 - 48);
                  }
                } while (++i4 < t3 && (r2 = e3[i4]) > 47 && r2 < 60);
                i4--;
                break;
              case 9:
                this._collect <<= 8, this._collect |= r2;
                break;
              case 10:
                const c2 = this._escHandlers[this._collect << 8 | r2];
                let l = c2 ? c2.length - 1 : -1;
                for (;l >= 0 && (s3 = c2[l](), s3 !== true); l--)
                  if (s3 instanceof Promise)
                    return this._preserveStack(4, c2, l, n2, i4), s3;
                l < 0 && this._escHandlerFb(this._collect << 8 | r2), this.precedingJoinState = 0;
                break;
              case 11:
                this._params.reset(), this._params.addParam(0), this._collect = 0;
                break;
              case 12:
                this._dcsParser.hook(this._collect << 8 | r2, this._params);
                break;
              case 13:
                for (let s4 = i4 + 1;; ++s4)
                  if (s4 >= t3 || (r2 = e3[s4]) === 24 || r2 === 26 || r2 === 27 || r2 > 127 && r2 < h) {
                    this._dcsParser.put(e3, i4, s4), i4 = s4 - 1;
                    break;
                  }
                break;
              case 14:
                if (s3 = this._dcsParser.unhook(r2 !== 24 && r2 !== 26), s3)
                  return this._preserveStack(6, [], 0, n2, i4), s3;
                r2 === 27 && (n2 |= 1), this._params.reset(), this._params.addParam(0), this._collect = 0, this.precedingJoinState = 0;
                break;
              case 4:
                this._oscParser.start();
                break;
              case 5:
                for (let s4 = i4 + 1;; s4++)
                  if (s4 >= t3 || (r2 = e3[s4]) < 32 || r2 > 127 && r2 < h) {
                    this._oscParser.put(e3, i4, s4), i4 = s4 - 1;
                    break;
                  }
                break;
              case 6:
                if (s3 = this._oscParser.end(r2 !== 24 && r2 !== 26), s3)
                  return this._preserveStack(5, [], 0, n2, i4), s3;
                r2 === 27 && (n2 |= 1), this._params.reset(), this._params.addParam(0), this._collect = 0, this.precedingJoinState = 0;
            }
            this.currentState = 15 & n2;
          }
        }
      }
      t2.EscapeSequenceParser = c;
    }, 6242: (e2, t2, i2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.OscHandler = t2.OscParser = undefined;
      const s2 = i2(5770), r = i2(482), n = [];
      t2.OscParser = class {
        constructor() {
          this._state = 0, this._active = n, this._id = -1, this._handlers = Object.create(null), this._handlerFb = () => {}, this._stack = { paused: false, loopPosition: 0, fallThrough: false };
        }
        registerHandler(e3, t3) {
          this._handlers[e3] === undefined && (this._handlers[e3] = []);
          const i3 = this._handlers[e3];
          return i3.push(t3), { dispose: () => {
            const e4 = i3.indexOf(t3);
            e4 !== -1 && i3.splice(e4, 1);
          } };
        }
        clearHandler(e3) {
          this._handlers[e3] && delete this._handlers[e3];
        }
        setHandlerFallback(e3) {
          this._handlerFb = e3;
        }
        dispose() {
          this._handlers = Object.create(null), this._handlerFb = () => {}, this._active = n;
        }
        reset() {
          if (this._state === 2)
            for (let e3 = this._stack.paused ? this._stack.loopPosition - 1 : this._active.length - 1;e3 >= 0; --e3)
              this._active[e3].end(false);
          this._stack.paused = false, this._active = n, this._id = -1, this._state = 0;
        }
        _start() {
          if (this._active = this._handlers[this._id] || n, this._active.length)
            for (let e3 = this._active.length - 1;e3 >= 0; e3--)
              this._active[e3].start();
          else
            this._handlerFb(this._id, "START");
        }
        _put(e3, t3, i3) {
          if (this._active.length)
            for (let s3 = this._active.length - 1;s3 >= 0; s3--)
              this._active[s3].put(e3, t3, i3);
          else
            this._handlerFb(this._id, "PUT", (0, r.utf32ToString)(e3, t3, i3));
        }
        start() {
          this.reset(), this._state = 1;
        }
        put(e3, t3, i3) {
          if (this._state !== 3) {
            if (this._state === 1)
              for (;t3 < i3; ) {
                const i4 = e3[t3++];
                if (i4 === 59) {
                  this._state = 2, this._start();
                  break;
                }
                if (i4 < 48 || 57 < i4)
                  return void (this._state = 3);
                this._id === -1 && (this._id = 0), this._id = 10 * this._id + i4 - 48;
              }
            this._state === 2 && i3 - t3 > 0 && this._put(e3, t3, i3);
          }
        }
        end(e3, t3 = true) {
          if (this._state !== 0) {
            if (this._state !== 3)
              if (this._state === 1 && this._start(), this._active.length) {
                let i3 = false, s3 = this._active.length - 1, r2 = false;
                if (this._stack.paused && (s3 = this._stack.loopPosition - 1, i3 = t3, r2 = this._stack.fallThrough, this._stack.paused = false), !r2 && i3 === false) {
                  for (;s3 >= 0 && (i3 = this._active[s3].end(e3), i3 !== true); s3--)
                    if (i3 instanceof Promise)
                      return this._stack.paused = true, this._stack.loopPosition = s3, this._stack.fallThrough = false, i3;
                  s3--;
                }
                for (;s3 >= 0; s3--)
                  if (i3 = this._active[s3].end(false), i3 instanceof Promise)
                    return this._stack.paused = true, this._stack.loopPosition = s3, this._stack.fallThrough = true, i3;
              } else
                this._handlerFb(this._id, "END", e3);
            this._active = n, this._id = -1, this._state = 0;
          }
        }
      }, t2.OscHandler = class {
        constructor(e3) {
          this._handler = e3, this._data = "", this._hitLimit = false;
        }
        start() {
          this._data = "", this._hitLimit = false;
        }
        put(e3, t3, i3) {
          this._hitLimit || (this._data += (0, r.utf32ToString)(e3, t3, i3), this._data.length > s2.PAYLOAD_LIMIT && (this._data = "", this._hitLimit = true));
        }
        end(e3) {
          let t3 = false;
          if (this._hitLimit)
            t3 = false;
          else if (e3 && (t3 = this._handler(this._data), t3 instanceof Promise))
            return t3.then((e4) => (this._data = "", this._hitLimit = false, e4));
          return this._data = "", this._hitLimit = false, t3;
        }
      };
    }, 8742: (e2, t2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.Params = undefined;
      const i2 = 2147483647;

      class s2 {
        static fromArray(e3) {
          const t3 = new s2;
          if (!e3.length)
            return t3;
          for (let i3 = Array.isArray(e3[0]) ? 1 : 0;i3 < e3.length; ++i3) {
            const s3 = e3[i3];
            if (Array.isArray(s3))
              for (let e4 = 0;e4 < s3.length; ++e4)
                t3.addSubParam(s3[e4]);
            else
              t3.addParam(s3);
          }
          return t3;
        }
        constructor(e3 = 32, t3 = 32) {
          if (this.maxLength = e3, this.maxSubParamsLength = t3, t3 > 256)
            throw new Error("maxSubParamsLength must not be greater than 256");
          this.params = new Int32Array(e3), this.length = 0, this._subParams = new Int32Array(t3), this._subParamsLength = 0, this._subParamsIdx = new Uint16Array(e3), this._rejectDigits = false, this._rejectSubDigits = false, this._digitIsSub = false;
        }
        clone() {
          const e3 = new s2(this.maxLength, this.maxSubParamsLength);
          return e3.params.set(this.params), e3.length = this.length, e3._subParams.set(this._subParams), e3._subParamsLength = this._subParamsLength, e3._subParamsIdx.set(this._subParamsIdx), e3._rejectDigits = this._rejectDigits, e3._rejectSubDigits = this._rejectSubDigits, e3._digitIsSub = this._digitIsSub, e3;
        }
        toArray() {
          const e3 = [];
          for (let t3 = 0;t3 < this.length; ++t3) {
            e3.push(this.params[t3]);
            const i3 = this._subParamsIdx[t3] >> 8, s3 = 255 & this._subParamsIdx[t3];
            s3 - i3 > 0 && e3.push(Array.prototype.slice.call(this._subParams, i3, s3));
          }
          return e3;
        }
        reset() {
          this.length = 0, this._subParamsLength = 0, this._rejectDigits = false, this._rejectSubDigits = false, this._digitIsSub = false;
        }
        addParam(e3) {
          if (this._digitIsSub = false, this.length >= this.maxLength)
            this._rejectDigits = true;
          else {
            if (e3 < -1)
              throw new Error("values lesser than -1 are not allowed");
            this._subParamsIdx[this.length] = this._subParamsLength << 8 | this._subParamsLength, this.params[this.length++] = e3 > i2 ? i2 : e3;
          }
        }
        addSubParam(e3) {
          if (this._digitIsSub = true, this.length)
            if (this._rejectDigits || this._subParamsLength >= this.maxSubParamsLength)
              this._rejectSubDigits = true;
            else {
              if (e3 < -1)
                throw new Error("values lesser than -1 are not allowed");
              this._subParams[this._subParamsLength++] = e3 > i2 ? i2 : e3, this._subParamsIdx[this.length - 1]++;
            }
        }
        hasSubParams(e3) {
          return (255 & this._subParamsIdx[e3]) - (this._subParamsIdx[e3] >> 8) > 0;
        }
        getSubParams(e3) {
          const t3 = this._subParamsIdx[e3] >> 8, i3 = 255 & this._subParamsIdx[e3];
          return i3 - t3 > 0 ? this._subParams.subarray(t3, i3) : null;
        }
        getSubParamsAll() {
          const e3 = {};
          for (let t3 = 0;t3 < this.length; ++t3) {
            const i3 = this._subParamsIdx[t3] >> 8, s3 = 255 & this._subParamsIdx[t3];
            s3 - i3 > 0 && (e3[t3] = this._subParams.slice(i3, s3));
          }
          return e3;
        }
        addDigit(e3) {
          let t3;
          if (this._rejectDigits || !(t3 = this._digitIsSub ? this._subParamsLength : this.length) || this._digitIsSub && this._rejectSubDigits)
            return;
          const s3 = this._digitIsSub ? this._subParams : this.params, r = s3[t3 - 1];
          s3[t3 - 1] = ~r ? Math.min(10 * r + e3, i2) : e3;
        }
      }
      t2.Params = s2;
    }, 5741: (e2, t2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.AddonManager = undefined, t2.AddonManager = class {
        constructor() {
          this._addons = [];
        }
        dispose() {
          for (let e3 = this._addons.length - 1;e3 >= 0; e3--)
            this._addons[e3].instance.dispose();
        }
        loadAddon(e3, t3) {
          const i2 = { instance: t3, dispose: t3.dispose, isDisposed: false };
          this._addons.push(i2), t3.dispose = () => this._wrappedAddonDispose(i2), t3.activate(e3);
        }
        _wrappedAddonDispose(e3) {
          if (e3.isDisposed)
            return;
          let t3 = -1;
          for (let i2 = 0;i2 < this._addons.length; i2++)
            if (this._addons[i2] === e3) {
              t3 = i2;
              break;
            }
          if (t3 === -1)
            throw new Error("Could not dispose an addon that has not been loaded");
          e3.isDisposed = true, e3.dispose.apply(e3.instance), this._addons.splice(t3, 1);
        }
      };
    }, 8771: (e2, t2, i2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.BufferApiView = undefined;
      const s2 = i2(3785), r = i2(511);
      t2.BufferApiView = class {
        constructor(e3, t3) {
          this._buffer = e3, this.type = t3;
        }
        init(e3) {
          return this._buffer = e3, this;
        }
        get cursorY() {
          return this._buffer.y;
        }
        get cursorX() {
          return this._buffer.x;
        }
        get viewportY() {
          return this._buffer.ydisp;
        }
        get baseY() {
          return this._buffer.ybase;
        }
        get length() {
          return this._buffer.lines.length;
        }
        getLine(e3) {
          const t3 = this._buffer.lines.get(e3);
          if (t3)
            return new s2.BufferLineApiView(t3);
        }
        getNullCell() {
          return new r.CellData;
        }
      };
    }, 3785: (e2, t2, i2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.BufferLineApiView = undefined;
      const s2 = i2(511);
      t2.BufferLineApiView = class {
        constructor(e3) {
          this._line = e3;
        }
        get isWrapped() {
          return this._line.isWrapped;
        }
        get length() {
          return this._line.length;
        }
        getCell(e3, t3) {
          if (!(e3 < 0 || e3 >= this._line.length))
            return t3 ? (this._line.loadCell(e3, t3), t3) : this._line.loadCell(e3, new s2.CellData);
        }
        translateToString(e3, t3, i3) {
          return this._line.translateToString(e3, t3, i3);
        }
      };
    }, 8285: (e2, t2, i2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.BufferNamespaceApi = undefined;
      const s2 = i2(8771), r = i2(8460), n = i2(844);

      class o extends n.Disposable {
        constructor(e3) {
          super(), this._core = e3, this._onBufferChange = this.register(new r.EventEmitter), this.onBufferChange = this._onBufferChange.event, this._normal = new s2.BufferApiView(this._core.buffers.normal, "normal"), this._alternate = new s2.BufferApiView(this._core.buffers.alt, "alternate"), this._core.buffers.onBufferActivate(() => this._onBufferChange.fire(this.active));
        }
        get active() {
          if (this._core.buffers.active === this._core.buffers.normal)
            return this.normal;
          if (this._core.buffers.active === this._core.buffers.alt)
            return this.alternate;
          throw new Error("Active buffer is neither normal nor alternate");
        }
        get normal() {
          return this._normal.init(this._core.buffers.normal);
        }
        get alternate() {
          return this._alternate.init(this._core.buffers.alt);
        }
      }
      t2.BufferNamespaceApi = o;
    }, 7975: (e2, t2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.ParserApi = undefined, t2.ParserApi = class {
        constructor(e3) {
          this._core = e3;
        }
        registerCsiHandler(e3, t3) {
          return this._core.registerCsiHandler(e3, (e4) => t3(e4.toArray()));
        }
        addCsiHandler(e3, t3) {
          return this.registerCsiHandler(e3, t3);
        }
        registerDcsHandler(e3, t3) {
          return this._core.registerDcsHandler(e3, (e4, i2) => t3(e4, i2.toArray()));
        }
        addDcsHandler(e3, t3) {
          return this.registerDcsHandler(e3, t3);
        }
        registerEscHandler(e3, t3) {
          return this._core.registerEscHandler(e3, t3);
        }
        addEscHandler(e3, t3) {
          return this.registerEscHandler(e3, t3);
        }
        registerOscHandler(e3, t3) {
          return this._core.registerOscHandler(e3, t3);
        }
        addOscHandler(e3, t3) {
          return this.registerOscHandler(e3, t3);
        }
      };
    }, 7090: (e2, t2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.UnicodeApi = undefined, t2.UnicodeApi = class {
        constructor(e3) {
          this._core = e3;
        }
        register(e3) {
          this._core.unicodeService.register(e3);
        }
        get versions() {
          return this._core.unicodeService.versions;
        }
        get activeVersion() {
          return this._core.unicodeService.activeVersion;
        }
        set activeVersion(e3) {
          this._core.unicodeService.activeVersion = e3;
        }
      };
    }, 744: function(e2, t2, i2) {
      var s2 = this && this.__decorate || function(e3, t3, i3, s3) {
        var r2, n2 = arguments.length, o2 = n2 < 3 ? t3 : s3 === null ? s3 = Object.getOwnPropertyDescriptor(t3, i3) : s3;
        if (typeof Reflect == "object" && typeof Reflect.decorate == "function")
          o2 = Reflect.decorate(e3, t3, i3, s3);
        else
          for (var a2 = e3.length - 1;a2 >= 0; a2--)
            (r2 = e3[a2]) && (o2 = (n2 < 3 ? r2(o2) : n2 > 3 ? r2(t3, i3, o2) : r2(t3, i3)) || o2);
        return n2 > 3 && o2 && Object.defineProperty(t3, i3, o2), o2;
      }, r = this && this.__param || function(e3, t3) {
        return function(i3, s3) {
          t3(i3, s3, e3);
        };
      };
      Object.defineProperty(t2, "__esModule", { value: true }), t2.BufferService = t2.MINIMUM_ROWS = t2.MINIMUM_COLS = undefined;
      const n = i2(8460), o = i2(844), a = i2(5295), h = i2(2585);
      t2.MINIMUM_COLS = 2, t2.MINIMUM_ROWS = 1;
      let c = t2.BufferService = class extends o.Disposable {
        get buffer() {
          return this.buffers.active;
        }
        constructor(e3) {
          super(), this.isUserScrolling = false, this._onResize = this.register(new n.EventEmitter), this.onResize = this._onResize.event, this._onScroll = this.register(new n.EventEmitter), this.onScroll = this._onScroll.event, this.cols = Math.max(e3.rawOptions.cols || 0, t2.MINIMUM_COLS), this.rows = Math.max(e3.rawOptions.rows || 0, t2.MINIMUM_ROWS), this.buffers = this.register(new a.BufferSet(e3, this));
        }
        resize(e3, t3) {
          this.cols = e3, this.rows = t3, this.buffers.resize(e3, t3), this._onResize.fire({ cols: e3, rows: t3 });
        }
        reset() {
          this.buffers.reset(), this.isUserScrolling = false;
        }
        scroll(e3, t3 = false) {
          const i3 = this.buffer;
          let s3;
          s3 = this._cachedBlankLine, s3 && s3.length === this.cols && s3.getFg(0) === e3.fg && s3.getBg(0) === e3.bg || (s3 = i3.getBlankLine(e3, t3), this._cachedBlankLine = s3), s3.isWrapped = t3;
          const r2 = i3.ybase + i3.scrollTop, n2 = i3.ybase + i3.scrollBottom;
          if (i3.scrollTop === 0) {
            const e4 = i3.lines.isFull;
            n2 === i3.lines.length - 1 ? e4 ? i3.lines.recycle().copyFrom(s3) : i3.lines.push(s3.clone()) : i3.lines.splice(n2 + 1, 0, s3.clone()), e4 ? this.isUserScrolling && (i3.ydisp = Math.max(i3.ydisp - 1, 0)) : (i3.ybase++, this.isUserScrolling || i3.ydisp++);
          } else {
            const e4 = n2 - r2 + 1;
            i3.lines.shiftElements(r2 + 1, e4 - 1, -1), i3.lines.set(n2, s3.clone());
          }
          this.isUserScrolling || (i3.ydisp = i3.ybase), this._onScroll.fire(i3.ydisp);
        }
        scrollLines(e3, t3, i3) {
          const s3 = this.buffer;
          if (e3 < 0) {
            if (s3.ydisp === 0)
              return;
            this.isUserScrolling = true;
          } else
            e3 + s3.ydisp >= s3.ybase && (this.isUserScrolling = false);
          const r2 = s3.ydisp;
          s3.ydisp = Math.max(Math.min(s3.ydisp + e3, s3.ybase), 0), r2 !== s3.ydisp && (t3 || this._onScroll.fire(s3.ydisp));
        }
      };
      t2.BufferService = c = s2([r(0, h.IOptionsService)], c);
    }, 7994: (e2, t2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.CharsetService = undefined, t2.CharsetService = class {
        constructor() {
          this.glevel = 0, this._charsets = [];
        }
        reset() {
          this.charset = undefined, this._charsets = [], this.glevel = 0;
        }
        setgLevel(e3) {
          this.glevel = e3, this.charset = this._charsets[e3];
        }
        setgCharset(e3, t3) {
          this._charsets[e3] = t3, this.glevel === e3 && (this.charset = t3);
        }
      };
    }, 1753: function(e2, t2, i2) {
      var s2 = this && this.__decorate || function(e3, t3, i3, s3) {
        var r2, n2 = arguments.length, o2 = n2 < 3 ? t3 : s3 === null ? s3 = Object.getOwnPropertyDescriptor(t3, i3) : s3;
        if (typeof Reflect == "object" && typeof Reflect.decorate == "function")
          o2 = Reflect.decorate(e3, t3, i3, s3);
        else
          for (var a2 = e3.length - 1;a2 >= 0; a2--)
            (r2 = e3[a2]) && (o2 = (n2 < 3 ? r2(o2) : n2 > 3 ? r2(t3, i3, o2) : r2(t3, i3)) || o2);
        return n2 > 3 && o2 && Object.defineProperty(t3, i3, o2), o2;
      }, r = this && this.__param || function(e3, t3) {
        return function(i3, s3) {
          t3(i3, s3, e3);
        };
      };
      Object.defineProperty(t2, "__esModule", { value: true }), t2.CoreMouseService = undefined;
      const n = i2(2585), o = i2(8460), a = i2(844), h = { NONE: { events: 0, restrict: () => false }, X10: { events: 1, restrict: (e3) => e3.button !== 4 && e3.action === 1 && (e3.ctrl = false, e3.alt = false, e3.shift = false, true) }, VT200: { events: 19, restrict: (e3) => e3.action !== 32 }, DRAG: { events: 23, restrict: (e3) => e3.action !== 32 || e3.button !== 3 }, ANY: { events: 31, restrict: (e3) => true } };
      function c(e3, t3) {
        let i3 = (e3.ctrl ? 16 : 0) | (e3.shift ? 4 : 0) | (e3.alt ? 8 : 0);
        return e3.button === 4 ? (i3 |= 64, i3 |= e3.action) : (i3 |= 3 & e3.button, 4 & e3.button && (i3 |= 64), 8 & e3.button && (i3 |= 128), e3.action === 32 ? i3 |= 32 : e3.action !== 0 || t3 || (i3 |= 3)), i3;
      }
      const l = String.fromCharCode, d = { DEFAULT: (e3) => {
        const t3 = [c(e3, false) + 32, e3.col + 32, e3.row + 32];
        return t3[0] > 255 || t3[1] > 255 || t3[2] > 255 ? "" : `\x1B[M${l(t3[0])}${l(t3[1])}${l(t3[2])}`;
      }, SGR: (e3) => {
        const t3 = e3.action === 0 && e3.button !== 4 ? "m" : "M";
        return `\x1B[<${c(e3, true)};${e3.col};${e3.row}${t3}`;
      }, SGR_PIXELS: (e3) => {
        const t3 = e3.action === 0 && e3.button !== 4 ? "m" : "M";
        return `\x1B[<${c(e3, true)};${e3.x};${e3.y}${t3}`;
      } };
      let _ = t2.CoreMouseService = class extends a.Disposable {
        constructor(e3, t3) {
          super(), this._bufferService = e3, this._coreService = t3, this._protocols = {}, this._encodings = {}, this._activeProtocol = "", this._activeEncoding = "", this._lastEvent = null, this._onProtocolChange = this.register(new o.EventEmitter), this.onProtocolChange = this._onProtocolChange.event;
          for (const e4 of Object.keys(h))
            this.addProtocol(e4, h[e4]);
          for (const e4 of Object.keys(d))
            this.addEncoding(e4, d[e4]);
          this.reset();
        }
        addProtocol(e3, t3) {
          this._protocols[e3] = t3;
        }
        addEncoding(e3, t3) {
          this._encodings[e3] = t3;
        }
        get activeProtocol() {
          return this._activeProtocol;
        }
        get areMouseEventsActive() {
          return this._protocols[this._activeProtocol].events !== 0;
        }
        set activeProtocol(e3) {
          if (!this._protocols[e3])
            throw new Error(`unknown protocol "${e3}"`);
          this._activeProtocol = e3, this._onProtocolChange.fire(this._protocols[e3].events);
        }
        get activeEncoding() {
          return this._activeEncoding;
        }
        set activeEncoding(e3) {
          if (!this._encodings[e3])
            throw new Error(`unknown encoding "${e3}"`);
          this._activeEncoding = e3;
        }
        reset() {
          this.activeProtocol = "NONE", this.activeEncoding = "DEFAULT", this._lastEvent = null;
        }
        triggerMouseEvent(e3) {
          if (e3.col < 0 || e3.col >= this._bufferService.cols || e3.row < 0 || e3.row >= this._bufferService.rows)
            return false;
          if (e3.button === 4 && e3.action === 32)
            return false;
          if (e3.button === 3 && e3.action !== 32)
            return false;
          if (e3.button !== 4 && (e3.action === 2 || e3.action === 3))
            return false;
          if (e3.col++, e3.row++, e3.action === 32 && this._lastEvent && this._equalEvents(this._lastEvent, e3, this._activeEncoding === "SGR_PIXELS"))
            return false;
          if (!this._protocols[this._activeProtocol].restrict(e3))
            return false;
          const t3 = this._encodings[this._activeEncoding](e3);
          return t3 && (this._activeEncoding === "DEFAULT" ? this._coreService.triggerBinaryEvent(t3) : this._coreService.triggerDataEvent(t3, true)), this._lastEvent = e3, true;
        }
        explainEvents(e3) {
          return { down: !!(1 & e3), up: !!(2 & e3), drag: !!(4 & e3), move: !!(8 & e3), wheel: !!(16 & e3) };
        }
        _equalEvents(e3, t3, i3) {
          if (i3) {
            if (e3.x !== t3.x)
              return false;
            if (e3.y !== t3.y)
              return false;
          } else {
            if (e3.col !== t3.col)
              return false;
            if (e3.row !== t3.row)
              return false;
          }
          return e3.button === t3.button && e3.action === t3.action && e3.ctrl === t3.ctrl && e3.alt === t3.alt && e3.shift === t3.shift;
        }
      };
      t2.CoreMouseService = _ = s2([r(0, n.IBufferService), r(1, n.ICoreService)], _);
    }, 6975: function(e2, t2, i2) {
      var s2 = this && this.__decorate || function(e3, t3, i3, s3) {
        var r2, n2 = arguments.length, o2 = n2 < 3 ? t3 : s3 === null ? s3 = Object.getOwnPropertyDescriptor(t3, i3) : s3;
        if (typeof Reflect == "object" && typeof Reflect.decorate == "function")
          o2 = Reflect.decorate(e3, t3, i3, s3);
        else
          for (var a2 = e3.length - 1;a2 >= 0; a2--)
            (r2 = e3[a2]) && (o2 = (n2 < 3 ? r2(o2) : n2 > 3 ? r2(t3, i3, o2) : r2(t3, i3)) || o2);
        return n2 > 3 && o2 && Object.defineProperty(t3, i3, o2), o2;
      }, r = this && this.__param || function(e3, t3) {
        return function(i3, s3) {
          t3(i3, s3, e3);
        };
      };
      Object.defineProperty(t2, "__esModule", { value: true }), t2.CoreService = undefined;
      const n = i2(1439), o = i2(8460), a = i2(844), h = i2(2585), c = Object.freeze({ insertMode: false }), l = Object.freeze({ applicationCursorKeys: false, applicationKeypad: false, bracketedPasteMode: false, origin: false, reverseWraparound: false, sendFocus: false, wraparound: true });
      let d = t2.CoreService = class extends a.Disposable {
        constructor(e3, t3, i3) {
          super(), this._bufferService = e3, this._logService = t3, this._optionsService = i3, this.isCursorInitialized = false, this.isCursorHidden = false, this._onData = this.register(new o.EventEmitter), this.onData = this._onData.event, this._onUserInput = this.register(new o.EventEmitter), this.onUserInput = this._onUserInput.event, this._onBinary = this.register(new o.EventEmitter), this.onBinary = this._onBinary.event, this._onRequestScrollToBottom = this.register(new o.EventEmitter), this.onRequestScrollToBottom = this._onRequestScrollToBottom.event, this.modes = (0, n.clone)(c), this.decPrivateModes = (0, n.clone)(l);
        }
        reset() {
          this.modes = (0, n.clone)(c), this.decPrivateModes = (0, n.clone)(l);
        }
        triggerDataEvent(e3, t3 = false) {
          if (this._optionsService.rawOptions.disableStdin)
            return;
          const i3 = this._bufferService.buffer;
          t3 && this._optionsService.rawOptions.scrollOnUserInput && i3.ybase !== i3.ydisp && this._onRequestScrollToBottom.fire(), t3 && this._onUserInput.fire(), this._logService.debug(`sending data "${e3}"`, () => e3.split("").map((e4) => e4.charCodeAt(0))), this._onData.fire(e3);
        }
        triggerBinaryEvent(e3) {
          this._optionsService.rawOptions.disableStdin || (this._logService.debug(`sending binary "${e3}"`, () => e3.split("").map((e4) => e4.charCodeAt(0))), this._onBinary.fire(e3));
        }
      };
      t2.CoreService = d = s2([r(0, h.IBufferService), r(1, h.ILogService), r(2, h.IOptionsService)], d);
    }, 9074: (e2, t2, i2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.DecorationService = undefined;
      const s2 = i2(8055), r = i2(8460), n = i2(844), o = i2(6106);
      let a = 0, h = 0;

      class c extends n.Disposable {
        get decorations() {
          return this._decorations.values();
        }
        constructor() {
          super(), this._decorations = new o.SortedList((e3) => e3?.marker.line), this._onDecorationRegistered = this.register(new r.EventEmitter), this.onDecorationRegistered = this._onDecorationRegistered.event, this._onDecorationRemoved = this.register(new r.EventEmitter), this.onDecorationRemoved = this._onDecorationRemoved.event, this.register((0, n.toDisposable)(() => this.reset()));
        }
        registerDecoration(e3) {
          if (e3.marker.isDisposed)
            return;
          const t3 = new l(e3);
          if (t3) {
            const e4 = t3.marker.onDispose(() => t3.dispose());
            t3.onDispose(() => {
              t3 && (this._decorations.delete(t3) && this._onDecorationRemoved.fire(t3), e4.dispose());
            }), this._decorations.insert(t3), this._onDecorationRegistered.fire(t3);
          }
          return t3;
        }
        reset() {
          for (const e3 of this._decorations.values())
            e3.dispose();
          this._decorations.clear();
        }
        *getDecorationsAtCell(e3, t3, i3) {
          let s3 = 0, r2 = 0;
          for (const n2 of this._decorations.getKeyIterator(t3))
            s3 = n2.options.x ?? 0, r2 = s3 + (n2.options.width ?? 1), e3 >= s3 && e3 < r2 && (!i3 || (n2.options.layer ?? "bottom") === i3) && (yield n2);
        }
        forEachDecorationAtCell(e3, t3, i3, s3) {
          this._decorations.forEachByKey(t3, (t4) => {
            a = t4.options.x ?? 0, h = a + (t4.options.width ?? 1), e3 >= a && e3 < h && (!i3 || (t4.options.layer ?? "bottom") === i3) && s3(t4);
          });
        }
      }
      t2.DecorationService = c;

      class l extends n.Disposable {
        get isDisposed() {
          return this._isDisposed;
        }
        get backgroundColorRGB() {
          return this._cachedBg === null && (this.options.backgroundColor ? this._cachedBg = s2.css.toColor(this.options.backgroundColor) : this._cachedBg = undefined), this._cachedBg;
        }
        get foregroundColorRGB() {
          return this._cachedFg === null && (this.options.foregroundColor ? this._cachedFg = s2.css.toColor(this.options.foregroundColor) : this._cachedFg = undefined), this._cachedFg;
        }
        constructor(e3) {
          super(), this.options = e3, this.onRenderEmitter = this.register(new r.EventEmitter), this.onRender = this.onRenderEmitter.event, this._onDispose = this.register(new r.EventEmitter), this.onDispose = this._onDispose.event, this._cachedBg = null, this._cachedFg = null, this.marker = e3.marker, this.options.overviewRulerOptions && !this.options.overviewRulerOptions.position && (this.options.overviewRulerOptions.position = "full");
        }
        dispose() {
          this._onDispose.fire(), super.dispose();
        }
      }
    }, 4348: (e2, t2, i2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.InstantiationService = t2.ServiceCollection = undefined;
      const s2 = i2(2585), r = i2(8343);

      class n {
        constructor(...e3) {
          this._entries = new Map;
          for (const [t3, i3] of e3)
            this.set(t3, i3);
        }
        set(e3, t3) {
          const i3 = this._entries.get(e3);
          return this._entries.set(e3, t3), i3;
        }
        forEach(e3) {
          for (const [t3, i3] of this._entries.entries())
            e3(t3, i3);
        }
        has(e3) {
          return this._entries.has(e3);
        }
        get(e3) {
          return this._entries.get(e3);
        }
      }
      t2.ServiceCollection = n, t2.InstantiationService = class {
        constructor() {
          this._services = new n, this._services.set(s2.IInstantiationService, this);
        }
        setService(e3, t3) {
          this._services.set(e3, t3);
        }
        getService(e3) {
          return this._services.get(e3);
        }
        createInstance(e3, ...t3) {
          const i3 = (0, r.getServiceDependencies)(e3).sort((e4, t4) => e4.index - t4.index), s3 = [];
          for (const t4 of i3) {
            const i4 = this._services.get(t4.id);
            if (!i4)
              throw new Error(`[createInstance] ${e3.name} depends on UNKNOWN service ${t4.id}.`);
            s3.push(i4);
          }
          const n2 = i3.length > 0 ? i3[0].index : t3.length;
          if (t3.length !== n2)
            throw new Error(`[createInstance] First service dependency of ${e3.name} at position ${n2 + 1} conflicts with ${t3.length} static arguments`);
          return new e3(...[...t3, ...s3]);
        }
      };
    }, 7866: function(e2, t2, i2) {
      var s2 = this && this.__decorate || function(e3, t3, i3, s3) {
        var r2, n2 = arguments.length, o2 = n2 < 3 ? t3 : s3 === null ? s3 = Object.getOwnPropertyDescriptor(t3, i3) : s3;
        if (typeof Reflect == "object" && typeof Reflect.decorate == "function")
          o2 = Reflect.decorate(e3, t3, i3, s3);
        else
          for (var a2 = e3.length - 1;a2 >= 0; a2--)
            (r2 = e3[a2]) && (o2 = (n2 < 3 ? r2(o2) : n2 > 3 ? r2(t3, i3, o2) : r2(t3, i3)) || o2);
        return n2 > 3 && o2 && Object.defineProperty(t3, i3, o2), o2;
      }, r = this && this.__param || function(e3, t3) {
        return function(i3, s3) {
          t3(i3, s3, e3);
        };
      };
      Object.defineProperty(t2, "__esModule", { value: true }), t2.traceCall = t2.setTraceLogger = t2.LogService = undefined;
      const n = i2(844), o = i2(2585), a = { trace: o.LogLevelEnum.TRACE, debug: o.LogLevelEnum.DEBUG, info: o.LogLevelEnum.INFO, warn: o.LogLevelEnum.WARN, error: o.LogLevelEnum.ERROR, off: o.LogLevelEnum.OFF };
      let h, c = t2.LogService = class extends n.Disposable {
        get logLevel() {
          return this._logLevel;
        }
        constructor(e3) {
          super(), this._optionsService = e3, this._logLevel = o.LogLevelEnum.OFF, this._updateLogLevel(), this.register(this._optionsService.onSpecificOptionChange("logLevel", () => this._updateLogLevel())), h = this;
        }
        _updateLogLevel() {
          this._logLevel = a[this._optionsService.rawOptions.logLevel];
        }
        _evalLazyOptionalParams(e3) {
          for (let t3 = 0;t3 < e3.length; t3++)
            typeof e3[t3] == "function" && (e3[t3] = e3[t3]());
        }
        _log(e3, t3, i3) {
          this._evalLazyOptionalParams(i3), e3.call(console, (this._optionsService.options.logger ? "" : "xterm.js: ") + t3, ...i3);
        }
        trace(e3, ...t3) {
          this._logLevel <= o.LogLevelEnum.TRACE && this._log(this._optionsService.options.logger?.trace.bind(this._optionsService.options.logger) ?? console.log, e3, t3);
        }
        debug(e3, ...t3) {
          this._logLevel <= o.LogLevelEnum.DEBUG && this._log(this._optionsService.options.logger?.debug.bind(this._optionsService.options.logger) ?? console.log, e3, t3);
        }
        info(e3, ...t3) {
          this._logLevel <= o.LogLevelEnum.INFO && this._log(this._optionsService.options.logger?.info.bind(this._optionsService.options.logger) ?? console.info, e3, t3);
        }
        warn(e3, ...t3) {
          this._logLevel <= o.LogLevelEnum.WARN && this._log(this._optionsService.options.logger?.warn.bind(this._optionsService.options.logger) ?? console.warn, e3, t3);
        }
        error(e3, ...t3) {
          this._logLevel <= o.LogLevelEnum.ERROR && this._log(this._optionsService.options.logger?.error.bind(this._optionsService.options.logger) ?? console.error, e3, t3);
        }
      };
      t2.LogService = c = s2([r(0, o.IOptionsService)], c), t2.setTraceLogger = function(e3) {
        h = e3;
      }, t2.traceCall = function(e3, t3, i3) {
        if (typeof i3.value != "function")
          throw new Error("not supported");
        const s3 = i3.value;
        i3.value = function(...e4) {
          if (h.logLevel !== o.LogLevelEnum.TRACE)
            return s3.apply(this, e4);
          h.trace(`GlyphRenderer#${s3.name}(${e4.map((e5) => JSON.stringify(e5)).join(", ")})`);
          const t4 = s3.apply(this, e4);
          return h.trace(`GlyphRenderer#${s3.name} return`, t4), t4;
        };
      };
    }, 7302: (e2, t2, i2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.OptionsService = t2.DEFAULT_OPTIONS = undefined;
      const s2 = i2(8460), r = i2(844), n = i2(6114);
      t2.DEFAULT_OPTIONS = { cols: 80, rows: 24, cursorBlink: false, cursorStyle: "block", cursorWidth: 1, cursorInactiveStyle: "outline", customGlyphs: true, drawBoldTextInBrightColors: true, documentOverride: null, fastScrollModifier: "alt", fastScrollSensitivity: 5, fontFamily: "courier-new, courier, monospace", fontSize: 15, fontWeight: "normal", fontWeightBold: "bold", ignoreBracketedPasteMode: false, lineHeight: 1, letterSpacing: 0, linkHandler: null, logLevel: "info", logger: null, scrollback: 1000, scrollOnUserInput: true, scrollSensitivity: 1, screenReaderMode: false, smoothScrollDuration: 0, macOptionIsMeta: false, macOptionClickForcesSelection: false, minimumContrastRatio: 1, disableStdin: false, allowProposedApi: false, allowTransparency: false, tabStopWidth: 8, theme: {}, rescaleOverlappingGlyphs: false, rightClickSelectsWord: n.isMac, windowOptions: {}, windowsMode: false, windowsPty: {}, wordSeparator: " ()[]{}',\"`", altClickMovesCursor: true, convertEol: false, termName: "xterm", cancelEvents: false, overviewRulerWidth: 0 };
      const o = ["normal", "bold", "100", "200", "300", "400", "500", "600", "700", "800", "900"];

      class a extends r.Disposable {
        constructor(e3) {
          super(), this._onOptionChange = this.register(new s2.EventEmitter), this.onOptionChange = this._onOptionChange.event;
          const i3 = { ...t2.DEFAULT_OPTIONS };
          for (const t3 in e3)
            if (t3 in i3)
              try {
                const s3 = e3[t3];
                i3[t3] = this._sanitizeAndValidateOption(t3, s3);
              } catch (e4) {
                console.error(e4);
              }
          this.rawOptions = i3, this.options = { ...i3 }, this._setupOptions(), this.register((0, r.toDisposable)(() => {
            this.rawOptions.linkHandler = null, this.rawOptions.documentOverride = null;
          }));
        }
        onSpecificOptionChange(e3, t3) {
          return this.onOptionChange((i3) => {
            i3 === e3 && t3(this.rawOptions[e3]);
          });
        }
        onMultipleOptionChange(e3, t3) {
          return this.onOptionChange((i3) => {
            e3.indexOf(i3) !== -1 && t3();
          });
        }
        _setupOptions() {
          const e3 = (e4) => {
            if (!(e4 in t2.DEFAULT_OPTIONS))
              throw new Error(`No option with key "${e4}"`);
            return this.rawOptions[e4];
          }, i3 = (e4, i4) => {
            if (!(e4 in t2.DEFAULT_OPTIONS))
              throw new Error(`No option with key "${e4}"`);
            i4 = this._sanitizeAndValidateOption(e4, i4), this.rawOptions[e4] !== i4 && (this.rawOptions[e4] = i4, this._onOptionChange.fire(e4));
          };
          for (const t3 in this.rawOptions) {
            const s3 = { get: e3.bind(this, t3), set: i3.bind(this, t3) };
            Object.defineProperty(this.options, t3, s3);
          }
        }
        _sanitizeAndValidateOption(e3, i3) {
          switch (e3) {
            case "cursorStyle":
              if (i3 || (i3 = t2.DEFAULT_OPTIONS[e3]), !function(e4) {
                return e4 === "block" || e4 === "underline" || e4 === "bar";
              }(i3))
                throw new Error(`"${i3}" is not a valid value for ${e3}`);
              break;
            case "wordSeparator":
              i3 || (i3 = t2.DEFAULT_OPTIONS[e3]);
              break;
            case "fontWeight":
            case "fontWeightBold":
              if (typeof i3 == "number" && 1 <= i3 && i3 <= 1000)
                break;
              i3 = o.includes(i3) ? i3 : t2.DEFAULT_OPTIONS[e3];
              break;
            case "cursorWidth":
              i3 = Math.floor(i3);
            case "lineHeight":
            case "tabStopWidth":
              if (i3 < 1)
                throw new Error(`${e3} cannot be less than 1, value: ${i3}`);
              break;
            case "minimumContrastRatio":
              i3 = Math.max(1, Math.min(21, Math.round(10 * i3) / 10));
              break;
            case "scrollback":
              if ((i3 = Math.min(i3, 4294967295)) < 0)
                throw new Error(`${e3} cannot be less than 0, value: ${i3}`);
              break;
            case "fastScrollSensitivity":
            case "scrollSensitivity":
              if (i3 <= 0)
                throw new Error(`${e3} cannot be less than or equal to 0, value: ${i3}`);
              break;
            case "rows":
            case "cols":
              if (!i3 && i3 !== 0)
                throw new Error(`${e3} must be numeric, value: ${i3}`);
              break;
            case "windowsPty":
              i3 = i3 ?? {};
          }
          return i3;
        }
      }
      t2.OptionsService = a;
    }, 2660: function(e2, t2, i2) {
      var s2 = this && this.__decorate || function(e3, t3, i3, s3) {
        var r2, n2 = arguments.length, o2 = n2 < 3 ? t3 : s3 === null ? s3 = Object.getOwnPropertyDescriptor(t3, i3) : s3;
        if (typeof Reflect == "object" && typeof Reflect.decorate == "function")
          o2 = Reflect.decorate(e3, t3, i3, s3);
        else
          for (var a = e3.length - 1;a >= 0; a--)
            (r2 = e3[a]) && (o2 = (n2 < 3 ? r2(o2) : n2 > 3 ? r2(t3, i3, o2) : r2(t3, i3)) || o2);
        return n2 > 3 && o2 && Object.defineProperty(t3, i3, o2), o2;
      }, r = this && this.__param || function(e3, t3) {
        return function(i3, s3) {
          t3(i3, s3, e3);
        };
      };
      Object.defineProperty(t2, "__esModule", { value: true }), t2.OscLinkService = undefined;
      const n = i2(2585);
      let o = t2.OscLinkService = class {
        constructor(e3) {
          this._bufferService = e3, this._nextId = 1, this._entriesWithId = new Map, this._dataByLinkId = new Map;
        }
        registerLink(e3) {
          const t3 = this._bufferService.buffer;
          if (e3.id === undefined) {
            const i4 = t3.addMarker(t3.ybase + t3.y), s4 = { data: e3, id: this._nextId++, lines: [i4] };
            return i4.onDispose(() => this._removeMarkerFromLink(s4, i4)), this._dataByLinkId.set(s4.id, s4), s4.id;
          }
          const i3 = e3, s3 = this._getEntryIdKey(i3), r2 = this._entriesWithId.get(s3);
          if (r2)
            return this.addLineToLink(r2.id, t3.ybase + t3.y), r2.id;
          const n2 = t3.addMarker(t3.ybase + t3.y), o2 = { id: this._nextId++, key: this._getEntryIdKey(i3), data: i3, lines: [n2] };
          return n2.onDispose(() => this._removeMarkerFromLink(o2, n2)), this._entriesWithId.set(o2.key, o2), this._dataByLinkId.set(o2.id, o2), o2.id;
        }
        addLineToLink(e3, t3) {
          const i3 = this._dataByLinkId.get(e3);
          if (i3 && i3.lines.every((e4) => e4.line !== t3)) {
            const e4 = this._bufferService.buffer.addMarker(t3);
            i3.lines.push(e4), e4.onDispose(() => this._removeMarkerFromLink(i3, e4));
          }
        }
        getLinkData(e3) {
          return this._dataByLinkId.get(e3)?.data;
        }
        _getEntryIdKey(e3) {
          return `${e3.id};;${e3.uri}`;
        }
        _removeMarkerFromLink(e3, t3) {
          const i3 = e3.lines.indexOf(t3);
          i3 !== -1 && (e3.lines.splice(i3, 1), e3.lines.length === 0 && (e3.data.id !== undefined && this._entriesWithId.delete(e3.key), this._dataByLinkId.delete(e3.id)));
        }
      };
      t2.OscLinkService = o = s2([r(0, n.IBufferService)], o);
    }, 8343: (e2, t2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.createDecorator = t2.getServiceDependencies = t2.serviceRegistry = undefined;
      const i2 = "di$target", s2 = "di$dependencies";
      t2.serviceRegistry = new Map, t2.getServiceDependencies = function(e3) {
        return e3[s2] || [];
      }, t2.createDecorator = function(e3) {
        if (t2.serviceRegistry.has(e3))
          return t2.serviceRegistry.get(e3);
        const r = function(e4, t3, n) {
          if (arguments.length !== 3)
            throw new Error("@IServiceName-decorator can only be used to decorate a parameter");
          (function(e5, t4, r2) {
            t4[i2] === t4 ? t4[s2].push({ id: e5, index: r2 }) : (t4[s2] = [{ id: e5, index: r2 }], t4[i2] = t4);
          })(r, e4, n);
        };
        return r.toString = () => e3, t2.serviceRegistry.set(e3, r), r;
      };
    }, 2585: (e2, t2, i2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.IDecorationService = t2.IUnicodeService = t2.IOscLinkService = t2.IOptionsService = t2.ILogService = t2.LogLevelEnum = t2.IInstantiationService = t2.ICharsetService = t2.ICoreService = t2.ICoreMouseService = t2.IBufferService = undefined;
      const s2 = i2(8343);
      var r;
      t2.IBufferService = (0, s2.createDecorator)("BufferService"), t2.ICoreMouseService = (0, s2.createDecorator)("CoreMouseService"), t2.ICoreService = (0, s2.createDecorator)("CoreService"), t2.ICharsetService = (0, s2.createDecorator)("CharsetService"), t2.IInstantiationService = (0, s2.createDecorator)("InstantiationService"), function(e3) {
        e3[e3.TRACE = 0] = "TRACE", e3[e3.DEBUG = 1] = "DEBUG", e3[e3.INFO = 2] = "INFO", e3[e3.WARN = 3] = "WARN", e3[e3.ERROR = 4] = "ERROR", e3[e3.OFF = 5] = "OFF";
      }(r || (t2.LogLevelEnum = r = {})), t2.ILogService = (0, s2.createDecorator)("LogService"), t2.IOptionsService = (0, s2.createDecorator)("OptionsService"), t2.IOscLinkService = (0, s2.createDecorator)("OscLinkService"), t2.IUnicodeService = (0, s2.createDecorator)("UnicodeService"), t2.IDecorationService = (0, s2.createDecorator)("DecorationService");
    }, 1480: (e2, t2, i2) => {
      Object.defineProperty(t2, "__esModule", { value: true }), t2.UnicodeService = undefined;
      const s2 = i2(8460), r = i2(225);

      class n {
        static extractShouldJoin(e3) {
          return (1 & e3) != 0;
        }
        static extractWidth(e3) {
          return e3 >> 1 & 3;
        }
        static extractCharKind(e3) {
          return e3 >> 3;
        }
        static createPropertyValue(e3, t3, i3 = false) {
          return (16777215 & e3) << 3 | (3 & t3) << 1 | (i3 ? 1 : 0);
        }
        constructor() {
          this._providers = Object.create(null), this._active = "", this._onChange = new s2.EventEmitter, this.onChange = this._onChange.event;
          const e3 = new r.UnicodeV6;
          this.register(e3), this._active = e3.version, this._activeProvider = e3;
        }
        dispose() {
          this._onChange.dispose();
        }
        get versions() {
          return Object.keys(this._providers);
        }
        get activeVersion() {
          return this._active;
        }
        set activeVersion(e3) {
          if (!this._providers[e3])
            throw new Error(`unknown Unicode version "${e3}"`);
          this._active = e3, this._activeProvider = this._providers[e3], this._onChange.fire(e3);
        }
        register(e3) {
          this._providers[e3.version] = e3;
        }
        wcwidth(e3) {
          return this._activeProvider.wcwidth(e3);
        }
        getStringCellWidth(e3) {
          let t3 = 0, i3 = 0;
          const s3 = e3.length;
          for (let r2 = 0;r2 < s3; ++r2) {
            let o = e3.charCodeAt(r2);
            if (55296 <= o && o <= 56319) {
              if (++r2 >= s3)
                return t3 + this.wcwidth(o);
              const i4 = e3.charCodeAt(r2);
              56320 <= i4 && i4 <= 57343 ? o = 1024 * (o - 55296) + i4 - 56320 + 65536 : t3 += this.wcwidth(i4);
            }
            const a = this.charProperties(o, i3);
            let h = n.extractWidth(a);
            n.extractShouldJoin(a) && (h -= n.extractWidth(i3)), t3 += h, i3 = a;
          }
          return t3;
        }
        charProperties(e3, t3) {
          return this._activeProvider.charProperties(e3, t3);
        }
      }
      t2.UnicodeService = n;
    } }, t = {};
    function i(s2) {
      var r = t[s2];
      if (r !== undefined)
        return r.exports;
      var n = t[s2] = { exports: {} };
      return e[s2].call(n.exports, n, n.exports, i), n.exports;
    }
    var s = {};
    return (() => {
      var e2 = s;
      Object.defineProperty(e2, "__esModule", { value: true }), e2.Terminal = undefined;
      const t2 = i(9042), r = i(3236), n = i(844), o = i(5741), a = i(8285), h = i(7975), c = i(7090), l = ["cols", "rows"];

      class d extends n.Disposable {
        constructor(e3) {
          super(), this._core = this.register(new r.Terminal(e3)), this._addonManager = this.register(new o.AddonManager), this._publicOptions = { ...this._core.options };
          const t3 = (e4) => this._core.options[e4], i2 = (e4, t4) => {
            this._checkReadonlyOptions(e4), this._core.options[e4] = t4;
          };
          for (const e4 in this._core.options) {
            const s2 = { get: t3.bind(this, e4), set: i2.bind(this, e4) };
            Object.defineProperty(this._publicOptions, e4, s2);
          }
        }
        _checkReadonlyOptions(e3) {
          if (l.includes(e3))
            throw new Error(`Option "${e3}" can only be set in the constructor`);
        }
        _checkProposedApi() {
          if (!this._core.optionsService.rawOptions.allowProposedApi)
            throw new Error("You must set the allowProposedApi option to true to use proposed API");
        }
        get onBell() {
          return this._core.onBell;
        }
        get onBinary() {
          return this._core.onBinary;
        }
        get onCursorMove() {
          return this._core.onCursorMove;
        }
        get onData() {
          return this._core.onData;
        }
        get onKey() {
          return this._core.onKey;
        }
        get onLineFeed() {
          return this._core.onLineFeed;
        }
        get onRender() {
          return this._core.onRender;
        }
        get onResize() {
          return this._core.onResize;
        }
        get onScroll() {
          return this._core.onScroll;
        }
        get onSelectionChange() {
          return this._core.onSelectionChange;
        }
        get onTitleChange() {
          return this._core.onTitleChange;
        }
        get onWriteParsed() {
          return this._core.onWriteParsed;
        }
        get element() {
          return this._core.element;
        }
        get parser() {
          return this._parser || (this._parser = new h.ParserApi(this._core)), this._parser;
        }
        get unicode() {
          return this._checkProposedApi(), new c.UnicodeApi(this._core);
        }
        get textarea() {
          return this._core.textarea;
        }
        get rows() {
          return this._core.rows;
        }
        get cols() {
          return this._core.cols;
        }
        get buffer() {
          return this._buffer || (this._buffer = this.register(new a.BufferNamespaceApi(this._core))), this._buffer;
        }
        get markers() {
          return this._checkProposedApi(), this._core.markers;
        }
        get modes() {
          const e3 = this._core.coreService.decPrivateModes;
          let t3 = "none";
          switch (this._core.coreMouseService.activeProtocol) {
            case "X10":
              t3 = "x10";
              break;
            case "VT200":
              t3 = "vt200";
              break;
            case "DRAG":
              t3 = "drag";
              break;
            case "ANY":
              t3 = "any";
          }
          return { applicationCursorKeysMode: e3.applicationCursorKeys, applicationKeypadMode: e3.applicationKeypad, bracketedPasteMode: e3.bracketedPasteMode, insertMode: this._core.coreService.modes.insertMode, mouseTrackingMode: t3, originMode: e3.origin, reverseWraparoundMode: e3.reverseWraparound, sendFocusMode: e3.sendFocus, wraparoundMode: e3.wraparound };
        }
        get options() {
          return this._publicOptions;
        }
        set options(e3) {
          for (const t3 in e3)
            this._publicOptions[t3] = e3[t3];
        }
        blur() {
          this._core.blur();
        }
        focus() {
          this._core.focus();
        }
        input(e3, t3 = true) {
          this._core.input(e3, t3);
        }
        resize(e3, t3) {
          this._verifyIntegers(e3, t3), this._core.resize(e3, t3);
        }
        open(e3) {
          this._core.open(e3);
        }
        attachCustomKeyEventHandler(e3) {
          this._core.attachCustomKeyEventHandler(e3);
        }
        attachCustomWheelEventHandler(e3) {
          this._core.attachCustomWheelEventHandler(e3);
        }
        registerLinkProvider(e3) {
          return this._core.registerLinkProvider(e3);
        }
        registerCharacterJoiner(e3) {
          return this._checkProposedApi(), this._core.registerCharacterJoiner(e3);
        }
        deregisterCharacterJoiner(e3) {
          this._checkProposedApi(), this._core.deregisterCharacterJoiner(e3);
        }
        registerMarker(e3 = 0) {
          return this._verifyIntegers(e3), this._core.registerMarker(e3);
        }
        registerDecoration(e3) {
          return this._checkProposedApi(), this._verifyPositiveIntegers(e3.x ?? 0, e3.width ?? 0, e3.height ?? 0), this._core.registerDecoration(e3);
        }
        hasSelection() {
          return this._core.hasSelection();
        }
        select(e3, t3, i2) {
          this._verifyIntegers(e3, t3, i2), this._core.select(e3, t3, i2);
        }
        getSelection() {
          return this._core.getSelection();
        }
        getSelectionPosition() {
          return this._core.getSelectionPosition();
        }
        clearSelection() {
          this._core.clearSelection();
        }
        selectAll() {
          this._core.selectAll();
        }
        selectLines(e3, t3) {
          this._verifyIntegers(e3, t3), this._core.selectLines(e3, t3);
        }
        dispose() {
          super.dispose();
        }
        scrollLines(e3) {
          this._verifyIntegers(e3), this._core.scrollLines(e3);
        }
        scrollPages(e3) {
          this._verifyIntegers(e3), this._core.scrollPages(e3);
        }
        scrollToTop() {
          this._core.scrollToTop();
        }
        scrollToBottom() {
          this._core.scrollToBottom();
        }
        scrollToLine(e3) {
          this._verifyIntegers(e3), this._core.scrollToLine(e3);
        }
        clear() {
          this._core.clear();
        }
        write(e3, t3) {
          this._core.write(e3, t3);
        }
        writeln(e3, t3) {
          this._core.write(e3), this._core.write(`\r
`, t3);
        }
        paste(e3) {
          this._core.paste(e3);
        }
        refresh(e3, t3) {
          this._verifyIntegers(e3, t3), this._core.refresh(e3, t3);
        }
        reset() {
          this._core.reset();
        }
        clearTextureAtlas() {
          this._core.clearTextureAtlas();
        }
        loadAddon(e3) {
          this._addonManager.loadAddon(this, e3);
        }
        static get strings() {
          return t2;
        }
        _verifyIntegers(...e3) {
          for (const t3 of e3)
            if (t3 === 1 / 0 || isNaN(t3) || t3 % 1 != 0)
              throw new Error("This API only accepts integers");
        }
        _verifyPositiveIntegers(...e3) {
          for (const t3 of e3)
            if (t3 && (t3 === 1 / 0 || isNaN(t3) || t3 % 1 != 0 || t3 < 0))
              throw new Error("This API only accepts positive integers");
        }
      }
      e2.Terminal = d;
    })(), s;
  })());
});

// node_modules/@xterm/addon-fit/lib/addon-fit.js
var require_addon_fit = __commonJS((exports, module) => {
  (function(e, t) {
    typeof exports == "object" && typeof module == "object" ? module.exports = t() : typeof define == "function" && define.amd ? define([], t) : typeof exports == "object" ? exports.FitAddon = t() : e.FitAddon = t();
  })(self, () => (() => {
    var e = {};
    return (() => {
      var t = e;
      Object.defineProperty(t, "__esModule", { value: true }), t.FitAddon = undefined, t.FitAddon = class {
        activate(e2) {
          this._terminal = e2;
        }
        dispose() {}
        fit() {
          const e2 = this.proposeDimensions();
          if (!e2 || !this._terminal || isNaN(e2.cols) || isNaN(e2.rows))
            return;
          const t2 = this._terminal._core;
          this._terminal.rows === e2.rows && this._terminal.cols === e2.cols || (t2._renderService.clear(), this._terminal.resize(e2.cols, e2.rows));
        }
        proposeDimensions() {
          if (!this._terminal)
            return;
          if (!this._terminal.element || !this._terminal.element.parentElement)
            return;
          const e2 = this._terminal._core, t2 = e2._renderService.dimensions;
          if (t2.css.cell.width === 0 || t2.css.cell.height === 0)
            return;
          const r = this._terminal.options.scrollback === 0 ? 0 : e2.viewport.scrollBarWidth, i = window.getComputedStyle(this._terminal.element.parentElement), o = parseInt(i.getPropertyValue("height")), s = Math.max(0, parseInt(i.getPropertyValue("width"))), n = window.getComputedStyle(this._terminal.element), l = o - (parseInt(n.getPropertyValue("padding-top")) + parseInt(n.getPropertyValue("padding-bottom"))), a = s - (parseInt(n.getPropertyValue("padding-right")) + parseInt(n.getPropertyValue("padding-left"))) - r;
          return { cols: Math.max(2, Math.floor(a / t2.css.cell.width)), rows: Math.max(1, Math.floor(l / t2.css.cell.height)) };
        }
      };
    })(), e;
  })());
});

// public/main.ts
var import_xterm = __toESM(require_xterm(), 1);
var import_addon_fit = __toESM(require_addon_fit(), 1);

// node_modules/@xterm/addon-webgl/lib/addon-webgl.mjs
var Lr = Object.defineProperty;
var wr = Object.getOwnPropertyDescriptor;
var Yi = (i, e, t, n) => {
  for (var s = n > 1 ? undefined : n ? wr(e, t) : e, o = i.length - 1, r;o >= 0; o--)
    (r = i[o]) && (s = (n ? r(e, t, s) : r(s)) || s);
  return n && s && Lr(e, t, s), s;
};
var Qi = (i, e) => (t, n) => e(t, n, i);
var pi = class {
  constructor() {
    this.listeners = [], this.unexpectedErrorHandler = function(e) {
      setTimeout(() => {
        throw e.stack ? bt.isErrorNoTelemetry(e) ? new bt(e.message + `

` + e.stack) : new Error(e.message + `

` + e.stack) : e;
      }, 0);
    };
  }
  addListener(e) {
    return this.listeners.push(e), () => {
      this._removeListener(e);
    };
  }
  emit(e) {
    this.listeners.forEach((t) => {
      t(e);
    });
  }
  _removeListener(e) {
    this.listeners.splice(this.listeners.indexOf(e), 1);
  }
  setUnexpectedErrorHandler(e) {
    this.unexpectedErrorHandler = e;
  }
  getUnexpectedErrorHandler() {
    return this.unexpectedErrorHandler;
  }
  onUnexpectedError(e) {
    this.unexpectedErrorHandler(e), this.emit(e);
  }
  onUnexpectedExternalError(e) {
    this.unexpectedErrorHandler(e);
  }
};
var Rr = new pi;
function Pe(i) {
  Dr(i) || Rr.onUnexpectedError(i);
}
var fi = "Canceled";
function Dr(i) {
  return i instanceof Ye ? true : i instanceof Error && i.name === fi && i.message === fi;
}
var Ye = class extends Error {
  constructor() {
    super(fi), this.name = this.message;
  }
};
var bt = class i extends Error {
  constructor(e) {
    super(e), this.name = "CodeExpectedError";
  }
  static fromError(e) {
    if (e instanceof i)
      return e;
    let t = new i;
    return t.message = e.message, t.stack = e.stack, t;
  }
  static isErrorNoTelemetry(e) {
    return e.name === "CodeExpectedError";
  }
};
function Mr(i2, e, t = 0, n = i2.length) {
  let s = t, o = n;
  for (;s < o; ) {
    let r = Math.floor((s + o) / 2);
    e(i2[r]) ? s = r + 1 : o = r;
  }
  return s - 1;
}
var vt = class vt2 {
  constructor(e) {
    this._array = e;
    this._findLastMonotonousLastIdx = 0;
  }
  findLastMonotonous(e) {
    if (vt2.assertInvariants) {
      if (this._prevFindLastPredicate) {
        for (let n of this._array)
          if (this._prevFindLastPredicate(n) && !e(n))
            throw new Error("MonotonousArray: current predicate must be weaker than (or equal to) the previous predicate.");
      }
      this._prevFindLastPredicate = e;
    }
    let t = Mr(this._array, e, this._findLastMonotonousLastIdx);
    return this._findLastMonotonousLastIdx = t + 1, t === -1 ? undefined : this._array[t];
  }
};
vt.assertInvariants = false;
var en;
((a) => {
  function i2(l) {
    return l < 0;
  }
  a.isLessThan = i2;
  function e(l) {
    return l <= 0;
  }
  a.isLessThanOrEqual = e;
  function t(l) {
    return l > 0;
  }
  a.isGreaterThan = t;
  function n(l) {
    return l === 0;
  }
  a.isNeitherLessOrGreaterThan = n, a.greaterThan = 1, a.lessThan = -1, a.neitherLessOrGreaterThan = 0;
})(en ||= {});
function tn(i2, e) {
  return (t, n) => e(i2(t), i2(n));
}
var nn = (i2, e) => i2 - e;
var Be = class Be2 {
  constructor(e) {
    this.iterate = e;
  }
  forEach(e) {
    this.iterate((t) => (e(t), true));
  }
  toArray() {
    let e = [];
    return this.iterate((t) => (e.push(t), true)), e;
  }
  filter(e) {
    return new Be2((t) => this.iterate((n) => e(n) ? t(n) : true));
  }
  map(e) {
    return new Be2((t) => this.iterate((n) => t(e(n))));
  }
  some(e) {
    let t = false;
    return this.iterate((n) => (t = e(n), !t)), t;
  }
  findFirst(e) {
    let t;
    return this.iterate((n) => e(n) ? (t = n, false) : true), t;
  }
  findLast(e) {
    let t;
    return this.iterate((n) => (e(n) && (t = n), true)), t;
  }
  findLastMaxBy(e) {
    let t, n = true;
    return this.iterate((s) => ((n || en.isGreaterThan(e(s, t))) && (n = false, t = s), true)), t;
  }
};
Be.empty = new Be((e) => {});
function an(i2, e) {
  let t = Object.create(null);
  for (let n of i2) {
    let s = e(n), o = t[s];
    o || (o = t[s] = []), o.push(n);
  }
  return t;
}
var sn;
var on;
var rn = class {
  constructor(e, t) {
    this.toKey = t;
    this._map = new Map;
    this[sn] = "SetWithKey";
    for (let n of e)
      this.add(n);
  }
  get size() {
    return this._map.size;
  }
  add(e) {
    let t = this.toKey(e);
    return this._map.set(t, e), this;
  }
  delete(e) {
    return this._map.delete(this.toKey(e));
  }
  has(e) {
    return this._map.has(this.toKey(e));
  }
  *entries() {
    for (let e of this._map.values())
      yield [e, e];
  }
  keys() {
    return this.values();
  }
  *values() {
    for (let e of this._map.values())
      yield e;
  }
  clear() {
    this._map.clear();
  }
  forEach(e, t) {
    this._map.forEach((n) => e.call(t, n, n, this));
  }
  [(on = Symbol.iterator, sn = Symbol.toStringTag, on)]() {
    return this.values();
  }
};
var Tt = class {
  constructor() {
    this.map = new Map;
  }
  add(e, t) {
    let n = this.map.get(e);
    n || (n = new Set, this.map.set(e, n)), n.add(t);
  }
  delete(e, t) {
    let n = this.map.get(e);
    n && (n.delete(t), n.size === 0 && this.map.delete(e));
  }
  forEach(e, t) {
    let n = this.map.get(e);
    n && n.forEach(t);
  }
  get(e) {
    let t = this.map.get(e);
    return t || new Set;
  }
};
function mi(i2, e) {
  let t = this, n = false, s;
  return function() {
    if (n)
      return s;
    if (n = true, e)
      try {
        s = i2.apply(t, arguments);
      } finally {
        e();
      }
    else
      s = i2.apply(t, arguments);
    return s;
  };
}
var _i;
((W) => {
  function i2(E) {
    return E && typeof E == "object" && typeof E[Symbol.iterator] == "function";
  }
  W.is = i2;
  let e = Object.freeze([]);
  function t() {
    return e;
  }
  W.empty = t;
  function* n(E) {
    yield E;
  }
  W.single = n;
  function s(E) {
    return i2(E) ? E : n(E);
  }
  W.wrap = s;
  function o(E) {
    return E || e;
  }
  W.from = o;
  function* r(E) {
    for (let y = E.length - 1;y >= 0; y--)
      yield E[y];
  }
  W.reverse = r;
  function a(E) {
    return !E || E[Symbol.iterator]().next().done === true;
  }
  W.isEmpty = a;
  function l(E) {
    return E[Symbol.iterator]().next().value;
  }
  W.first = l;
  function u(E, y) {
    let w = 0;
    for (let G of E)
      if (y(G, w++))
        return true;
    return false;
  }
  W.some = u;
  function c(E, y) {
    for (let w of E)
      if (y(w))
        return w;
  }
  W.find = c;
  function* d(E, y) {
    for (let w of E)
      y(w) && (yield w);
  }
  W.filter = d;
  function* h(E, y) {
    let w = 0;
    for (let G of E)
      yield y(G, w++);
  }
  W.map = h;
  function* f(E, y) {
    let w = 0;
    for (let G of E)
      yield* y(G, w++);
  }
  W.flatMap = f;
  function* I(...E) {
    for (let y of E)
      yield* y;
  }
  W.concat = I;
  function L(E, y, w) {
    let G = w;
    for (let ue of E)
      G = y(G, ue);
    return G;
  }
  W.reduce = L;
  function* M(E, y, w = E.length) {
    for (y < 0 && (y += E.length), w < 0 ? w += E.length : w > E.length && (w = E.length);y < w; y++)
      yield E[y];
  }
  W.slice = M;
  function q(E, y = Number.POSITIVE_INFINITY) {
    let w = [];
    if (y === 0)
      return [w, E];
    let G = E[Symbol.iterator]();
    for (let ue = 0;ue < y; ue++) {
      let Se = G.next();
      if (Se.done)
        return [w, W.empty()];
      w.push(Se.value);
    }
    return [w, { [Symbol.iterator]() {
      return G;
    } }];
  }
  W.consume = q;
  async function S(E) {
    let y = [];
    for await (let w of E)
      y.push(w);
    return Promise.resolve(y);
  }
  W.asyncToArray = S;
})(_i ||= {});
var Ar = false;
var Ne = null;
var gt = class gt2 {
  constructor() {
    this.livingDisposables = new Map;
  }
  getDisposableData(e) {
    let t = this.livingDisposables.get(e);
    return t || (t = { parent: null, source: null, isSingleton: false, value: e, idx: gt2.idx++ }, this.livingDisposables.set(e, t)), t;
  }
  trackDisposable(e) {
    let t = this.getDisposableData(e);
    t.source || (t.source = new Error().stack);
  }
  setParent(e, t) {
    let n = this.getDisposableData(e);
    n.parent = t;
  }
  markAsDisposed(e) {
    this.livingDisposables.delete(e);
  }
  markAsSingleton(e) {
    this.getDisposableData(e).isSingleton = true;
  }
  getRootParent(e, t) {
    let n = t.get(e);
    if (n)
      return n;
    let s = e.parent ? this.getRootParent(this.getDisposableData(e.parent), t) : e;
    return t.set(e, s), s;
  }
  getTrackedDisposables() {
    let e = new Map;
    return [...this.livingDisposables.entries()].filter(([, n]) => n.source !== null && !this.getRootParent(n, e).isSingleton).flatMap(([n]) => n);
  }
  computeLeakingDisposables(e = 10, t) {
    let n;
    if (t)
      n = t;
    else {
      let l = new Map, u = [...this.livingDisposables.values()].filter((d) => d.source !== null && !this.getRootParent(d, l).isSingleton);
      if (u.length === 0)
        return;
      let c = new Set(u.map((d) => d.value));
      if (n = u.filter((d) => !(d.parent && c.has(d.parent))), n.length === 0)
        throw new Error("There are cyclic diposable chains!");
    }
    if (!n)
      return;
    function s(l) {
      function u(d, h) {
        for (;d.length > 0 && h.some((f) => typeof f == "string" ? f === d[0] : d[0].match(f)); )
          d.shift();
      }
      let c = l.source.split(`
`).map((d) => d.trim().replace("at ", "")).filter((d) => d !== "");
      return u(c, ["Error", /^trackDisposable \(.*\)$/, /^DisposableTracker.trackDisposable \(.*\)$/]), c.reverse();
    }
    let o = new Tt;
    for (let l of n) {
      let u = s(l);
      for (let c = 0;c <= u.length; c++)
        o.add(u.slice(0, c).join(`
`), l);
    }
    n.sort(tn((l) => l.idx, nn));
    let r = "", a = 0;
    for (let l of n.slice(0, e)) {
      a++;
      let u = s(l), c = [];
      for (let d = 0;d < u.length; d++) {
        let h = u[d];
        h = `(shared with ${o.get(u.slice(0, d + 1).join(`
`)).size}/${n.length} leaks) at ${h}`;
        let I = o.get(u.slice(0, d).join(`
`)), L = an([...I].map((M) => s(M)[d]), (M) => M);
        delete L[u[d]];
        for (let [M, q] of Object.entries(L))
          c.unshift(`    - stacktraces of ${q.length} other leaks continue with ${M}`);
        c.unshift(h);
      }
      r += `


==================== Leaking disposable ${a}/${n.length}: ${l.value.constructor.name} ====================
${c.join(`
`)}
============================================================

`;
    }
    return n.length > e && (r += `


... and ${n.length - e} more leaking disposables

`), { leaks: n, details: r };
  }
};
gt.idx = 0;
function Sr(i2) {
  Ne = i2;
}
if (Ar) {
  let i2 = "__is_disposable_tracked__";
  Sr(new class {
    trackDisposable(e) {
      let t = new Error("Potentially leaked disposable").stack;
      setTimeout(() => {
        e[i2] || console.log(t);
      }, 3000);
    }
    setParent(e, t) {
      if (e && e !== B.None)
        try {
          e[i2] = true;
        } catch {}
    }
    markAsDisposed(e) {
      if (e && e !== B.None)
        try {
          e[i2] = true;
        } catch {}
    }
    markAsSingleton(e) {}
  });
}
function Et(i2) {
  return Ne?.trackDisposable(i2), i2;
}
function yt(i2) {
  Ne?.markAsDisposed(i2);
}
function Qe(i2, e) {
  Ne?.setParent(i2, e);
}
function Or(i2, e) {
  if (Ne)
    for (let t of i2)
      Ne.setParent(t, e);
}
function un(i2) {
  if (_i.is(i2)) {
    let e = [];
    for (let t of i2)
      if (t)
        try {
          t.dispose();
        } catch (n) {
          e.push(n);
        }
    if (e.length === 1)
      throw e[0];
    if (e.length > 1)
      throw new AggregateError(e, "Encountered errors while disposing of store");
    return Array.isArray(i2) ? [] : i2;
  } else if (i2)
    return i2.dispose(), i2;
}
function It(...i2) {
  let e = O(() => un(i2));
  return Or(i2, e), e;
}
function O(i2) {
  let e = Et({ dispose: mi(() => {
    yt(e), i2();
  }) });
  return e;
}
var xt = class xt2 {
  constructor() {
    this._toDispose = new Set;
    this._isDisposed = false;
    Et(this);
  }
  dispose() {
    this._isDisposed || (yt(this), this._isDisposed = true, this.clear());
  }
  get isDisposed() {
    return this._isDisposed;
  }
  clear() {
    if (this._toDispose.size !== 0)
      try {
        un(this._toDispose);
      } finally {
        this._toDispose.clear();
      }
  }
  add(e) {
    if (!e)
      return e;
    if (e === this)
      throw new Error("Cannot register a disposable on itself!");
    return Qe(e, this), this._isDisposed ? xt2.DISABLE_DISPOSED_WARNING || console.warn(new Error("Trying to add a disposable to a DisposableStore that has already been disposed of. The added object will be leaked!").stack) : this._toDispose.add(e), e;
  }
  delete(e) {
    if (e) {
      if (e === this)
        throw new Error("Cannot dispose a disposable on itself!");
      this._toDispose.delete(e), e.dispose();
    }
  }
  deleteAndLeak(e) {
    e && this._toDispose.has(e) && (this._toDispose.delete(e), Qe(e, null));
  }
};
xt.DISABLE_DISPOSED_WARNING = false;
var fe = xt;
var B = class {
  constructor() {
    this._store = new fe;
    Et(this), Qe(this._store, this);
  }
  dispose() {
    yt(this), this._store.dispose();
  }
  _register(e) {
    if (e === this)
      throw new Error("Cannot register a disposable on itself!");
    return this._store.add(e);
  }
};
B.None = Object.freeze({ dispose() {} });
var be = class {
  constructor() {
    this._isDisposed = false;
    Et(this);
  }
  get value() {
    return this._isDisposed ? undefined : this._value;
  }
  set value(e) {
    this._isDisposed || e === this._value || (this._value?.dispose(), e && Qe(e, this), this._value = e);
  }
  clear() {
    this.value = undefined;
  }
  dispose() {
    this._isDisposed = true, yt(this), this._value?.dispose(), this._value = undefined;
  }
  clearAndLeak() {
    let e = this._value;
    return this._value = undefined, e && Qe(e, null), e;
  }
};
var Lt = typeof process < "u" && "title" in process;
var Ze = Lt ? "node" : navigator.userAgent;
var bi = Lt ? "node" : navigator.platform;
var cn = Ze.includes("Firefox");
var dn = Ze.includes("Edge");
var vi = /^((?!chrome|android).)*safari/i.test(Ze);
function hn() {
  if (!vi)
    return 0;
  let i2 = Ze.match(/Version\/(\d+)/);
  return i2 === null || i2.length < 2 ? 0 : parseInt(i2[1]);
}
var oo = ["Macintosh", "MacIntel", "MacPPC", "Mac68K"].includes(bi);
var ao = ["Windows", "Win16", "Win32", "WinCE"].includes(bi);
var lo = bi.indexOf("Linux") >= 0;
var uo = /\bCrOS\b/.test(Ze);
var pn = "";
var K = 0;
var V = 0;
var C = 0;
var U = 0;
var Z = { css: "#00000000", rgba: 0 };
var X;
((n) => {
  function i2(s, o, r, a) {
    return a !== undefined ? `#${Oe(s)}${Oe(o)}${Oe(r)}${Oe(a)}` : `#${Oe(s)}${Oe(o)}${Oe(r)}`;
  }
  n.toCss = i2;
  function e(s, o, r, a = 255) {
    return (s << 24 | o << 16 | r << 8 | a) >>> 0;
  }
  n.toRgba = e;
  function t(s, o, r, a) {
    return { css: n.toCss(s, o, r, a), rgba: n.toRgba(s, o, r, a) };
  }
  n.toColor = t;
})(X ||= {});
var Ue;
((a) => {
  function i2(l, u) {
    if (U = (u.rgba & 255) / 255, U === 1)
      return { css: u.css, rgba: u.rgba };
    let c = u.rgba >> 24 & 255, d = u.rgba >> 16 & 255, h = u.rgba >> 8 & 255, f = l.rgba >> 24 & 255, I = l.rgba >> 16 & 255, L = l.rgba >> 8 & 255;
    K = f + Math.round((c - f) * U), V = I + Math.round((d - I) * U), C = L + Math.round((h - L) * U);
    let M = X.toCss(K, V, C), q = X.toRgba(K, V, C);
    return { css: M, rgba: q };
  }
  a.blend = i2;
  function e(l) {
    return (l.rgba & 255) === 255;
  }
  a.isOpaque = e;
  function t(l, u, c) {
    let d = Te.ensureContrastRatio(l.rgba, u.rgba, c);
    if (d)
      return X.toColor(d >> 24 & 255, d >> 16 & 255, d >> 8 & 255);
  }
  a.ensureContrastRatio = t;
  function n(l) {
    let u = (l.rgba | 255) >>> 0;
    return [K, V, C] = Te.toChannels(u), { css: X.toCss(K, V, C), rgba: u };
  }
  a.opaque = n;
  function s(l, u) {
    return U = Math.round(u * 255), [K, V, C] = Te.toChannels(l.rgba), { css: X.toCss(K, V, C, U), rgba: X.toRgba(K, V, C, U) };
  }
  a.opacity = s;
  function o(l, u) {
    return U = l.rgba & 255, s(l, U * u / 255);
  }
  a.multiplyOpacity = o;
  function r(l) {
    return [l.rgba >> 24 & 255, l.rgba >> 16 & 255, l.rgba >> 8 & 255];
  }
  a.toColorRGB = r;
})(Ue ||= {});
var Fr;
((n) => {
  let i2, e;
  try {
    let s = document.createElement("canvas");
    s.width = 1, s.height = 1;
    let o = s.getContext("2d", { willReadFrequently: true });
    o && (i2 = o, i2.globalCompositeOperation = "copy", e = i2.createLinearGradient(0, 0, 1, 1));
  } catch {}
  function t(s) {
    if (s.match(/#[\da-f]{3,8}/i))
      switch (s.length) {
        case 4:
          return K = parseInt(s.slice(1, 2).repeat(2), 16), V = parseInt(s.slice(2, 3).repeat(2), 16), C = parseInt(s.slice(3, 4).repeat(2), 16), X.toColor(K, V, C);
        case 5:
          return K = parseInt(s.slice(1, 2).repeat(2), 16), V = parseInt(s.slice(2, 3).repeat(2), 16), C = parseInt(s.slice(3, 4).repeat(2), 16), U = parseInt(s.slice(4, 5).repeat(2), 16), X.toColor(K, V, C, U);
        case 7:
          return { css: s, rgba: (parseInt(s.slice(1), 16) << 8 | 255) >>> 0 };
        case 9:
          return { css: s, rgba: parseInt(s.slice(1), 16) >>> 0 };
      }
    let o = s.match(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(,\s*(0|1|\d?\.(\d+))\s*)?\)/);
    if (o)
      return K = parseInt(o[1]), V = parseInt(o[2]), C = parseInt(o[3]), U = Math.round((o[5] === undefined ? 1 : parseFloat(o[5])) * 255), X.toColor(K, V, C, U);
    if (!i2 || !e)
      throw new Error("css.toColor: Unsupported css format");
    if (i2.fillStyle = e, i2.fillStyle = s, typeof i2.fillStyle != "string")
      throw new Error("css.toColor: Unsupported css format");
    if (i2.fillRect(0, 0, 1, 1), [K, V, C, U] = i2.getImageData(0, 0, 1, 1).data, U !== 255)
      throw new Error("css.toColor: Unsupported css format");
    return { rgba: X.toRgba(K, V, C, U), css: s };
  }
  n.toColor = t;
})(Fr ||= {});
var Y;
((t) => {
  function i2(n) {
    return e(n >> 16 & 255, n >> 8 & 255, n & 255);
  }
  t.relativeLuminance = i2;
  function e(n, s, o) {
    let r = n / 255, a = s / 255, l = o / 255, u = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4), c = a <= 0.03928 ? a / 12.92 : Math.pow((a + 0.055) / 1.055, 2.4), d = l <= 0.03928 ? l / 12.92 : Math.pow((l + 0.055) / 1.055, 2.4);
    return u * 0.2126 + c * 0.7152 + d * 0.0722;
  }
  t.relativeLuminance2 = e;
})(Y ||= {});
var Te;
((o) => {
  function i2(r, a) {
    if (U = (a & 255) / 255, U === 1)
      return a;
    let l = a >> 24 & 255, u = a >> 16 & 255, c = a >> 8 & 255, d = r >> 24 & 255, h = r >> 16 & 255, f = r >> 8 & 255;
    return K = d + Math.round((l - d) * U), V = h + Math.round((u - h) * U), C = f + Math.round((c - f) * U), X.toRgba(K, V, C);
  }
  o.blend = i2;
  function e(r, a, l) {
    let u = Y.relativeLuminance(r >> 8), c = Y.relativeLuminance(a >> 8);
    if (ve(u, c) < l) {
      if (c < u) {
        let I = t(r, a, l), L = ve(u, Y.relativeLuminance(I >> 8));
        if (L < l) {
          let M = n(r, a, l), q = ve(u, Y.relativeLuminance(M >> 8));
          return L > q ? I : M;
        }
        return I;
      }
      let h = n(r, a, l), f = ve(u, Y.relativeLuminance(h >> 8));
      if (f < l) {
        let I = t(r, a, l), L = ve(u, Y.relativeLuminance(I >> 8));
        return f > L ? h : I;
      }
      return h;
    }
  }
  o.ensureContrastRatio = e;
  function t(r, a, l) {
    let u = r >> 24 & 255, c = r >> 16 & 255, d = r >> 8 & 255, h = a >> 24 & 255, f = a >> 16 & 255, I = a >> 8 & 255, L = ve(Y.relativeLuminance2(h, f, I), Y.relativeLuminance2(u, c, d));
    for (;L < l && (h > 0 || f > 0 || I > 0); )
      h -= Math.max(0, Math.ceil(h * 0.1)), f -= Math.max(0, Math.ceil(f * 0.1)), I -= Math.max(0, Math.ceil(I * 0.1)), L = ve(Y.relativeLuminance2(h, f, I), Y.relativeLuminance2(u, c, d));
    return (h << 24 | f << 16 | I << 8 | 255) >>> 0;
  }
  o.reduceLuminance = t;
  function n(r, a, l) {
    let u = r >> 24 & 255, c = r >> 16 & 255, d = r >> 8 & 255, h = a >> 24 & 255, f = a >> 16 & 255, I = a >> 8 & 255, L = ve(Y.relativeLuminance2(h, f, I), Y.relativeLuminance2(u, c, d));
    for (;L < l && (h < 255 || f < 255 || I < 255); )
      h = Math.min(255, h + Math.ceil((255 - h) * 0.1)), f = Math.min(255, f + Math.ceil((255 - f) * 0.1)), I = Math.min(255, I + Math.ceil((255 - I) * 0.1)), L = ve(Y.relativeLuminance2(h, f, I), Y.relativeLuminance2(u, c, d));
    return (h << 24 | f << 16 | I << 8 | 255) >>> 0;
  }
  o.increaseLuminance = n;
  function s(r) {
    return [r >> 24 & 255, r >> 16 & 255, r >> 8 & 255, r & 255];
  }
  o.toChannels = s;
})(Te ||= {});
function Oe(i2) {
  let e = i2.toString(16);
  return e.length < 2 ? "0" + e : e;
}
function ve(i2, e) {
  return i2 < e ? (e + 0.05) / (i2 + 0.05) : (i2 + 0.05) / (e + 0.05);
}
function F(i2) {
  if (!i2)
    throw new Error("value must not be falsy");
  return i2;
}
function Rt(i2) {
  return 57508 <= i2 && i2 <= 57558;
}
function fn(i2) {
  return 57520 <= i2 && i2 <= 57527;
}
function kr(i2) {
  return 57344 <= i2 && i2 <= 63743;
}
function Pr(i2) {
  return 9472 <= i2 && i2 <= 9631;
}
function Br(i2) {
  return i2 >= 128512 && i2 <= 128591 || i2 >= 127744 && i2 <= 128511 || i2 >= 128640 && i2 <= 128767 || i2 >= 9728 && i2 <= 9983 || i2 >= 9984 && i2 <= 10175 || i2 >= 65024 && i2 <= 65039 || i2 >= 129280 && i2 <= 129535 || i2 >= 127462 && i2 <= 127487;
}
function mn(i2, e, t, n) {
  return e === 1 && t > Math.ceil(n * 1.5) && i2 !== undefined && i2 > 255 && !Br(i2) && !Rt(i2) && !kr(i2);
}
function Dt(i2) {
  return Rt(i2) || Pr(i2);
}
function _n() {
  return { css: { canvas: wt(), cell: wt() }, device: { canvas: wt(), cell: wt(), char: { width: 0, height: 0, left: 0, top: 0 } } };
}
function wt() {
  return { width: 0, height: 0 };
}
function bn(i2, e, t = 0) {
  return (i2 - (Math.round(e) * 2 - t)) % (Math.round(e) * 2);
}
var j = 0;
var z = 0;
var me = false;
var ge = false;
var Mt = false;
var J;
var Ti = 0;
var At = class {
  constructor(e, t, n, s, o, r) {
    this._terminal = e;
    this._optionService = t;
    this._selectionRenderModel = n;
    this._decorationService = s;
    this._coreBrowserService = o;
    this._themeService = r;
    this.result = { fg: 0, bg: 0, ext: 0 };
  }
  resolve(e, t, n, s) {
    if (this.result.bg = e.bg, this.result.fg = e.fg, this.result.ext = e.bg & 268435456 ? e.extended.ext : 0, z = 0, j = 0, ge = false, me = false, Mt = false, J = this._themeService.colors, Ti = 0, e.getCode() !== 0 && e.extended.underlineStyle === 4) {
      let r = Math.max(1, Math.floor(this._optionService.rawOptions.fontSize * this._coreBrowserService.dpr / 15));
      Ti = t * s % (Math.round(r) * 2);
    }
    if (this._decorationService.forEachDecorationAtCell(t, n, "bottom", (r) => {
      r.backgroundColorRGB && (z = r.backgroundColorRGB.rgba >> 8 & 16777215, ge = true), r.foregroundColorRGB && (j = r.foregroundColorRGB.rgba >> 8 & 16777215, me = true);
    }), Mt = this._selectionRenderModel.isCellSelected(this._terminal, t, n), Mt) {
      if (this.result.fg & 67108864 || (this.result.bg & 50331648) !== 0) {
        if (this.result.fg & 67108864)
          switch (this.result.fg & 50331648) {
            case 16777216:
            case 33554432:
              z = this._themeService.colors.ansi[this.result.fg & 255].rgba;
              break;
            case 50331648:
              z = (this.result.fg & 16777215) << 8 | 255;
              break;
            case 0:
            default:
              z = this._themeService.colors.foreground.rgba;
          }
        else
          switch (this.result.bg & 50331648) {
            case 16777216:
            case 33554432:
              z = this._themeService.colors.ansi[this.result.bg & 255].rgba;
              break;
            case 50331648:
              z = (this.result.bg & 16777215) << 8 | 255;
              break;
          }
        z = Te.blend(z, (this._coreBrowserService.isFocused ? J.selectionBackgroundOpaque : J.selectionInactiveBackgroundOpaque).rgba & 4294967040 | 128) >> 8 & 16777215;
      } else
        z = (this._coreBrowserService.isFocused ? J.selectionBackgroundOpaque : J.selectionInactiveBackgroundOpaque).rgba >> 8 & 16777215;
      if (ge = true, J.selectionForeground && (j = J.selectionForeground.rgba >> 8 & 16777215, me = true), Dt(e.getCode())) {
        if (this.result.fg & 67108864 && (this.result.bg & 50331648) === 0)
          j = (this._coreBrowserService.isFocused ? J.selectionBackgroundOpaque : J.selectionInactiveBackgroundOpaque).rgba >> 8 & 16777215;
        else {
          if (this.result.fg & 67108864)
            switch (this.result.bg & 50331648) {
              case 16777216:
              case 33554432:
                j = this._themeService.colors.ansi[this.result.bg & 255].rgba;
                break;
              case 50331648:
                j = (this.result.bg & 16777215) << 8 | 255;
                break;
            }
          else
            switch (this.result.fg & 50331648) {
              case 16777216:
              case 33554432:
                j = this._themeService.colors.ansi[this.result.fg & 255].rgba;
                break;
              case 50331648:
                j = (this.result.fg & 16777215) << 8 | 255;
                break;
              case 0:
              default:
                j = this._themeService.colors.foreground.rgba;
            }
          j = Te.blend(j, (this._coreBrowserService.isFocused ? J.selectionBackgroundOpaque : J.selectionInactiveBackgroundOpaque).rgba & 4294967040 | 128) >> 8 & 16777215;
        }
        me = true;
      }
    }
    this._decorationService.forEachDecorationAtCell(t, n, "top", (r) => {
      r.backgroundColorRGB && (z = r.backgroundColorRGB.rgba >> 8 & 16777215, ge = true), r.foregroundColorRGB && (j = r.foregroundColorRGB.rgba >> 8 & 16777215, me = true);
    }), ge && (Mt ? z = e.bg & -16777216 & -134217729 | z | 50331648 : z = e.bg & -16777216 | z | 50331648), me && (j = e.fg & -16777216 & -67108865 | j | 50331648), this.result.fg & 67108864 && (ge && !me && ((this.result.bg & 50331648) === 0 ? j = this.result.fg & -134217728 | J.background.rgba >> 8 & 16777215 & 16777215 | 50331648 : j = this.result.fg & -134217728 | this.result.bg & 67108863, me = true), !ge && me && ((this.result.fg & 50331648) === 0 ? z = this.result.bg & -67108864 | J.foreground.rgba >> 8 & 16777215 & 16777215 | 50331648 : z = this.result.bg & -67108864 | this.result.fg & 67108863, ge = true)), J = undefined, this.result.bg = ge ? z : this.result.bg, this.result.fg = me ? j : this.result.fg, this.result.ext &= 536870911, this.result.ext |= Ti << 29 & 3758096384;
  }
};
var gn = 0.5;
var St = cn || dn ? "bottom" : "ideographic";
var Hr = { "▀": [{ x: 0, y: 0, w: 8, h: 4 }], "▁": [{ x: 0, y: 7, w: 8, h: 1 }], "▂": [{ x: 0, y: 6, w: 8, h: 2 }], "▃": [{ x: 0, y: 5, w: 8, h: 3 }], "▄": [{ x: 0, y: 4, w: 8, h: 4 }], "▅": [{ x: 0, y: 3, w: 8, h: 5 }], "▆": [{ x: 0, y: 2, w: 8, h: 6 }], "▇": [{ x: 0, y: 1, w: 8, h: 7 }], "█": [{ x: 0, y: 0, w: 8, h: 8 }], "▉": [{ x: 0, y: 0, w: 7, h: 8 }], "▊": [{ x: 0, y: 0, w: 6, h: 8 }], "▋": [{ x: 0, y: 0, w: 5, h: 8 }], "▌": [{ x: 0, y: 0, w: 4, h: 8 }], "▍": [{ x: 0, y: 0, w: 3, h: 8 }], "▎": [{ x: 0, y: 0, w: 2, h: 8 }], "▏": [{ x: 0, y: 0, w: 1, h: 8 }], "▐": [{ x: 4, y: 0, w: 4, h: 8 }], "▔": [{ x: 0, y: 0, w: 8, h: 1 }], "▕": [{ x: 7, y: 0, w: 1, h: 8 }], "▖": [{ x: 0, y: 4, w: 4, h: 4 }], "▗": [{ x: 4, y: 4, w: 4, h: 4 }], "▘": [{ x: 0, y: 0, w: 4, h: 4 }], "▙": [{ x: 0, y: 0, w: 4, h: 8 }, { x: 0, y: 4, w: 8, h: 4 }], "▚": [{ x: 0, y: 0, w: 4, h: 4 }, { x: 4, y: 4, w: 4, h: 4 }], "▛": [{ x: 0, y: 0, w: 4, h: 8 }, { x: 4, y: 0, w: 4, h: 4 }], "▜": [{ x: 0, y: 0, w: 8, h: 4 }, { x: 4, y: 0, w: 4, h: 8 }], "▝": [{ x: 4, y: 0, w: 4, h: 4 }], "▞": [{ x: 4, y: 0, w: 4, h: 4 }, { x: 0, y: 4, w: 4, h: 4 }], "▟": [{ x: 4, y: 0, w: 4, h: 8 }, { x: 0, y: 4, w: 8, h: 4 }], "\uD83E\uDF70": [{ x: 1, y: 0, w: 1, h: 8 }], "\uD83E\uDF71": [{ x: 2, y: 0, w: 1, h: 8 }], "\uD83E\uDF72": [{ x: 3, y: 0, w: 1, h: 8 }], "\uD83E\uDF73": [{ x: 4, y: 0, w: 1, h: 8 }], "\uD83E\uDF74": [{ x: 5, y: 0, w: 1, h: 8 }], "\uD83E\uDF75": [{ x: 6, y: 0, w: 1, h: 8 }], "\uD83E\uDF76": [{ x: 0, y: 1, w: 8, h: 1 }], "\uD83E\uDF77": [{ x: 0, y: 2, w: 8, h: 1 }], "\uD83E\uDF78": [{ x: 0, y: 3, w: 8, h: 1 }], "\uD83E\uDF79": [{ x: 0, y: 4, w: 8, h: 1 }], "\uD83E\uDF7A": [{ x: 0, y: 5, w: 8, h: 1 }], "\uD83E\uDF7B": [{ x: 0, y: 6, w: 8, h: 1 }], "\uD83E\uDF7C": [{ x: 0, y: 0, w: 1, h: 8 }, { x: 0, y: 7, w: 8, h: 1 }], "\uD83E\uDF7D": [{ x: 0, y: 0, w: 1, h: 8 }, { x: 0, y: 0, w: 8, h: 1 }], "\uD83E\uDF7E": [{ x: 7, y: 0, w: 1, h: 8 }, { x: 0, y: 0, w: 8, h: 1 }], "\uD83E\uDF7F": [{ x: 7, y: 0, w: 1, h: 8 }, { x: 0, y: 7, w: 8, h: 1 }], "\uD83E\uDF80": [{ x: 0, y: 0, w: 8, h: 1 }, { x: 0, y: 7, w: 8, h: 1 }], "\uD83E\uDF81": [{ x: 0, y: 0, w: 8, h: 1 }, { x: 0, y: 2, w: 8, h: 1 }, { x: 0, y: 4, w: 8, h: 1 }, { x: 0, y: 7, w: 8, h: 1 }], "\uD83E\uDF82": [{ x: 0, y: 0, w: 8, h: 2 }], "\uD83E\uDF83": [{ x: 0, y: 0, w: 8, h: 3 }], "\uD83E\uDF84": [{ x: 0, y: 0, w: 8, h: 5 }], "\uD83E\uDF85": [{ x: 0, y: 0, w: 8, h: 6 }], "\uD83E\uDF86": [{ x: 0, y: 0, w: 8, h: 7 }], "\uD83E\uDF87": [{ x: 6, y: 0, w: 2, h: 8 }], "\uD83E\uDF88": [{ x: 5, y: 0, w: 3, h: 8 }], "\uD83E\uDF89": [{ x: 3, y: 0, w: 5, h: 8 }], "\uD83E\uDF8A": [{ x: 2, y: 0, w: 6, h: 8 }], "\uD83E\uDF8B": [{ x: 1, y: 0, w: 7, h: 8 }], "\uD83E\uDF95": [{ x: 0, y: 0, w: 2, h: 2 }, { x: 4, y: 0, w: 2, h: 2 }, { x: 2, y: 2, w: 2, h: 2 }, { x: 6, y: 2, w: 2, h: 2 }, { x: 0, y: 4, w: 2, h: 2 }, { x: 4, y: 4, w: 2, h: 2 }, { x: 2, y: 6, w: 2, h: 2 }, { x: 6, y: 6, w: 2, h: 2 }], "\uD83E\uDF96": [{ x: 2, y: 0, w: 2, h: 2 }, { x: 6, y: 0, w: 2, h: 2 }, { x: 0, y: 2, w: 2, h: 2 }, { x: 4, y: 2, w: 2, h: 2 }, { x: 2, y: 4, w: 2, h: 2 }, { x: 6, y: 4, w: 2, h: 2 }, { x: 0, y: 6, w: 2, h: 2 }, { x: 4, y: 6, w: 2, h: 2 }], "\uD83E\uDF97": [{ x: 0, y: 2, w: 8, h: 2 }, { x: 0, y: 6, w: 8, h: 2 }] };
var Wr = { "░": [[1, 0, 0, 0], [0, 0, 0, 0], [0, 0, 1, 0], [0, 0, 0, 0]], "▒": [[1, 0], [0, 0], [0, 1], [0, 0]], "▓": [[0, 1], [1, 1], [1, 0], [1, 1]] };
var Gr = { "─": { 1: "M0,.5 L1,.5" }, "━": { 3: "M0,.5 L1,.5" }, "│": { 1: "M.5,0 L.5,1" }, "┃": { 3: "M.5,0 L.5,1" }, "┌": { 1: "M0.5,1 L.5,.5 L1,.5" }, "┏": { 3: "M0.5,1 L.5,.5 L1,.5" }, "┐": { 1: "M0,.5 L.5,.5 L.5,1" }, "┓": { 3: "M0,.5 L.5,.5 L.5,1" }, "└": { 1: "M.5,0 L.5,.5 L1,.5" }, "┗": { 3: "M.5,0 L.5,.5 L1,.5" }, "┘": { 1: "M.5,0 L.5,.5 L0,.5" }, "┛": { 3: "M.5,0 L.5,.5 L0,.5" }, "├": { 1: "M.5,0 L.5,1 M.5,.5 L1,.5" }, "┣": { 3: "M.5,0 L.5,1 M.5,.5 L1,.5" }, "┤": { 1: "M.5,0 L.5,1 M.5,.5 L0,.5" }, "┫": { 3: "M.5,0 L.5,1 M.5,.5 L0,.5" }, "┬": { 1: "M0,.5 L1,.5 M.5,.5 L.5,1" }, "┳": { 3: "M0,.5 L1,.5 M.5,.5 L.5,1" }, "┴": { 1: "M0,.5 L1,.5 M.5,.5 L.5,0" }, "┻": { 3: "M0,.5 L1,.5 M.5,.5 L.5,0" }, "┼": { 1: "M0,.5 L1,.5 M.5,0 L.5,1" }, "╋": { 3: "M0,.5 L1,.5 M.5,0 L.5,1" }, "╴": { 1: "M.5,.5 L0,.5" }, "╸": { 3: "M.5,.5 L0,.5" }, "╵": { 1: "M.5,.5 L.5,0" }, "╹": { 3: "M.5,.5 L.5,0" }, "╶": { 1: "M.5,.5 L1,.5" }, "╺": { 3: "M.5,.5 L1,.5" }, "╷": { 1: "M.5,.5 L.5,1" }, "╻": { 3: "M.5,.5 L.5,1" }, "═": { 1: (i2, e) => `M0,${0.5 - e} L1,${0.5 - e} M0,${0.5 + e} L1,${0.5 + e}` }, "║": { 1: (i2, e) => `M${0.5 - i2},0 L${0.5 - i2},1 M${0.5 + i2},0 L${0.5 + i2},1` }, "╒": { 1: (i2, e) => `M.5,1 L.5,${0.5 - e} L1,${0.5 - e} M.5,${0.5 + e} L1,${0.5 + e}` }, "╓": { 1: (i2, e) => `M${0.5 - i2},1 L${0.5 - i2},.5 L1,.5 M${0.5 + i2},.5 L${0.5 + i2},1` }, "╔": { 1: (i2, e) => `M1,${0.5 - e} L${0.5 - i2},${0.5 - e} L${0.5 - i2},1 M1,${0.5 + e} L${0.5 + i2},${0.5 + e} L${0.5 + i2},1` }, "╕": { 1: (i2, e) => `M0,${0.5 - e} L.5,${0.5 - e} L.5,1 M0,${0.5 + e} L.5,${0.5 + e}` }, "╖": { 1: (i2, e) => `M${0.5 + i2},1 L${0.5 + i2},.5 L0,.5 M${0.5 - i2},.5 L${0.5 - i2},1` }, "╗": { 1: (i2, e) => `M0,${0.5 + e} L${0.5 - i2},${0.5 + e} L${0.5 - i2},1 M0,${0.5 - e} L${0.5 + i2},${0.5 - e} L${0.5 + i2},1` }, "╘": { 1: (i2, e) => `M.5,0 L.5,${0.5 + e} L1,${0.5 + e} M.5,${0.5 - e} L1,${0.5 - e}` }, "╙": { 1: (i2, e) => `M1,.5 L${0.5 - i2},.5 L${0.5 - i2},0 M${0.5 + i2},.5 L${0.5 + i2},0` }, "╚": { 1: (i2, e) => `M1,${0.5 - e} L${0.5 + i2},${0.5 - e} L${0.5 + i2},0 M1,${0.5 + e} L${0.5 - i2},${0.5 + e} L${0.5 - i2},0` }, "╛": { 1: (i2, e) => `M0,${0.5 + e} L.5,${0.5 + e} L.5,0 M0,${0.5 - e} L.5,${0.5 - e}` }, "╜": { 1: (i2, e) => `M0,.5 L${0.5 + i2},.5 L${0.5 + i2},0 M${0.5 - i2},.5 L${0.5 - i2},0` }, "╝": { 1: (i2, e) => `M0,${0.5 - e} L${0.5 - i2},${0.5 - e} L${0.5 - i2},0 M0,${0.5 + e} L${0.5 + i2},${0.5 + e} L${0.5 + i2},0` }, "╞": { 1: (i2, e) => `M.5,0 L.5,1 M.5,${0.5 - e} L1,${0.5 - e} M.5,${0.5 + e} L1,${0.5 + e}` }, "╟": { 1: (i2, e) => `M${0.5 - i2},0 L${0.5 - i2},1 M${0.5 + i2},0 L${0.5 + i2},1 M${0.5 + i2},.5 L1,.5` }, "╠": { 1: (i2, e) => `M${0.5 - i2},0 L${0.5 - i2},1 M1,${0.5 + e} L${0.5 + i2},${0.5 + e} L${0.5 + i2},1 M1,${0.5 - e} L${0.5 + i2},${0.5 - e} L${0.5 + i2},0` }, "╡": { 1: (i2, e) => `M.5,0 L.5,1 M0,${0.5 - e} L.5,${0.5 - e} M0,${0.5 + e} L.5,${0.5 + e}` }, "╢": { 1: (i2, e) => `M0,.5 L${0.5 - i2},.5 M${0.5 - i2},0 L${0.5 - i2},1 M${0.5 + i2},0 L${0.5 + i2},1` }, "╣": { 1: (i2, e) => `M${0.5 + i2},0 L${0.5 + i2},1 M0,${0.5 + e} L${0.5 - i2},${0.5 + e} L${0.5 - i2},1 M0,${0.5 - e} L${0.5 - i2},${0.5 - e} L${0.5 - i2},0` }, "╤": { 1: (i2, e) => `M0,${0.5 - e} L1,${0.5 - e} M0,${0.5 + e} L1,${0.5 + e} M.5,${0.5 + e} L.5,1` }, "╥": { 1: (i2, e) => `M0,.5 L1,.5 M${0.5 - i2},.5 L${0.5 - i2},1 M${0.5 + i2},.5 L${0.5 + i2},1` }, "╦": { 1: (i2, e) => `M0,${0.5 - e} L1,${0.5 - e} M0,${0.5 + e} L${0.5 - i2},${0.5 + e} L${0.5 - i2},1 M1,${0.5 + e} L${0.5 + i2},${0.5 + e} L${0.5 + i2},1` }, "╧": { 1: (i2, e) => `M.5,0 L.5,${0.5 - e} M0,${0.5 - e} L1,${0.5 - e} M0,${0.5 + e} L1,${0.5 + e}` }, "╨": { 1: (i2, e) => `M0,.5 L1,.5 M${0.5 - i2},.5 L${0.5 - i2},0 M${0.5 + i2},.5 L${0.5 + i2},0` }, "╩": { 1: (i2, e) => `M0,${0.5 + e} L1,${0.5 + e} M0,${0.5 - e} L${0.5 - i2},${0.5 - e} L${0.5 - i2},0 M1,${0.5 - e} L${0.5 + i2},${0.5 - e} L${0.5 + i2},0` }, "╪": { 1: (i2, e) => `M.5,0 L.5,1 M0,${0.5 - e} L1,${0.5 - e} M0,${0.5 + e} L1,${0.5 + e}` }, "╫": { 1: (i2, e) => `M0,.5 L1,.5 M${0.5 - i2},0 L${0.5 - i2},1 M${0.5 + i2},0 L${0.5 + i2},1` }, "╬": { 1: (i2, e) => `M0,${0.5 + e} L${0.5 - i2},${0.5 + e} L${0.5 - i2},1 M1,${0.5 + e} L${0.5 + i2},${0.5 + e} L${0.5 + i2},1 M0,${0.5 - e} L${0.5 - i2},${0.5 - e} L${0.5 - i2},0 M1,${0.5 - e} L${0.5 + i2},${0.5 - e} L${0.5 + i2},0` }, "╱": { 1: "M1,0 L0,1" }, "╲": { 1: "M0,0 L1,1" }, "╳": { 1: "M1,0 L0,1 M0,0 L1,1" }, "╼": { 1: "M.5,.5 L0,.5", 3: "M.5,.5 L1,.5" }, "╽": { 1: "M.5,.5 L.5,0", 3: "M.5,.5 L.5,1" }, "╾": { 1: "M.5,.5 L1,.5", 3: "M.5,.5 L0,.5" }, "╿": { 1: "M.5,.5 L.5,1", 3: "M.5,.5 L.5,0" }, "┍": { 1: "M.5,.5 L.5,1", 3: "M.5,.5 L1,.5" }, "┎": { 1: "M.5,.5 L1,.5", 3: "M.5,.5 L.5,1" }, "┑": { 1: "M.5,.5 L.5,1", 3: "M.5,.5 L0,.5" }, "┒": { 1: "M.5,.5 L0,.5", 3: "M.5,.5 L.5,1" }, "┕": { 1: "M.5,.5 L.5,0", 3: "M.5,.5 L1,.5" }, "┖": { 1: "M.5,.5 L1,.5", 3: "M.5,.5 L.5,0" }, "┙": { 1: "M.5,.5 L.5,0", 3: "M.5,.5 L0,.5" }, "┚": { 1: "M.5,.5 L0,.5", 3: "M.5,.5 L.5,0" }, "┝": { 1: "M.5,0 L.5,1", 3: "M.5,.5 L1,.5" }, "┞": { 1: "M0.5,1 L.5,.5 L1,.5", 3: "M.5,.5 L.5,0" }, "┟": { 1: "M.5,0 L.5,.5 L1,.5", 3: "M.5,.5 L.5,1" }, "┠": { 1: "M.5,.5 L1,.5", 3: "M.5,0 L.5,1" }, "┡": { 1: "M.5,.5 L.5,1", 3: "M.5,0 L.5,.5 L1,.5" }, "┢": { 1: "M.5,.5 L.5,0", 3: "M0.5,1 L.5,.5 L1,.5" }, "┥": { 1: "M.5,0 L.5,1", 3: "M.5,.5 L0,.5" }, "┦": { 1: "M0,.5 L.5,.5 L.5,1", 3: "M.5,.5 L.5,0" }, "┧": { 1: "M.5,0 L.5,.5 L0,.5", 3: "M.5,.5 L.5,1" }, "┨": { 1: "M.5,.5 L0,.5", 3: "M.5,0 L.5,1" }, "┩": { 1: "M.5,.5 L.5,1", 3: "M.5,0 L.5,.5 L0,.5" }, "┪": { 1: "M.5,.5 L.5,0", 3: "M0,.5 L.5,.5 L.5,1" }, "┭": { 1: "M0.5,1 L.5,.5 L1,.5", 3: "M.5,.5 L0,.5" }, "┮": { 1: "M0,.5 L.5,.5 L.5,1", 3: "M.5,.5 L1,.5" }, "┯": { 1: "M.5,.5 L.5,1", 3: "M0,.5 L1,.5" }, "┰": { 1: "M0,.5 L1,.5", 3: "M.5,.5 L.5,1" }, "┱": { 1: "M.5,.5 L1,.5", 3: "M0,.5 L.5,.5 L.5,1" }, "┲": { 1: "M.5,.5 L0,.5", 3: "M0.5,1 L.5,.5 L1,.5" }, "┵": { 1: "M.5,0 L.5,.5 L1,.5", 3: "M.5,.5 L0,.5" }, "┶": { 1: "M.5,0 L.5,.5 L0,.5", 3: "M.5,.5 L1,.5" }, "┷": { 1: "M.5,.5 L.5,0", 3: "M0,.5 L1,.5" }, "┸": { 1: "M0,.5 L1,.5", 3: "M.5,.5 L.5,0" }, "┹": { 1: "M.5,.5 L1,.5", 3: "M.5,0 L.5,.5 L0,.5" }, "┺": { 1: "M.5,.5 L0,.5", 3: "M.5,0 L.5,.5 L1,.5" }, "┽": { 1: "M.5,0 L.5,1 M.5,.5 L1,.5", 3: "M.5,.5 L0,.5" }, "┾": { 1: "M.5,0 L.5,1 M.5,.5 L0,.5", 3: "M.5,.5 L1,.5" }, "┿": { 1: "M.5,0 L.5,1", 3: "M0,.5 L1,.5" }, "╀": { 1: "M0,.5 L1,.5 M.5,.5 L.5,1", 3: "M.5,.5 L.5,0" }, "╁": { 1: "M.5,.5 L.5,0 M0,.5 L1,.5", 3: "M.5,.5 L.5,1" }, "╂": { 1: "M0,.5 L1,.5", 3: "M.5,0 L.5,1" }, "╃": { 1: "M0.5,1 L.5,.5 L1,.5", 3: "M.5,0 L.5,.5 L0,.5" }, "╄": { 1: "M0,.5 L.5,.5 L.5,1", 3: "M.5,0 L.5,.5 L1,.5" }, "╅": { 1: "M.5,0 L.5,.5 L1,.5", 3: "M0,.5 L.5,.5 L.5,1" }, "╆": { 1: "M.5,0 L.5,.5 L0,.5", 3: "M0.5,1 L.5,.5 L1,.5" }, "╇": { 1: "M.5,.5 L.5,1", 3: "M.5,.5 L.5,0 M0,.5 L1,.5" }, "╈": { 1: "M.5,.5 L.5,0", 3: "M0,.5 L1,.5 M.5,.5 L.5,1" }, "╉": { 1: "M.5,.5 L1,.5", 3: "M.5,0 L.5,1 M.5,.5 L0,.5" }, "╊": { 1: "M.5,.5 L0,.5", 3: "M.5,0 L.5,1 M.5,.5 L1,.5" }, "╌": { 1: "M.1,.5 L.4,.5 M.6,.5 L.9,.5" }, "╍": { 3: "M.1,.5 L.4,.5 M.6,.5 L.9,.5" }, "┄": { 1: "M.0667,.5 L.2667,.5 M.4,.5 L.6,.5 M.7333,.5 L.9333,.5" }, "┅": { 3: "M.0667,.5 L.2667,.5 M.4,.5 L.6,.5 M.7333,.5 L.9333,.5" }, "┈": { 1: "M.05,.5 L.2,.5 M.3,.5 L.45,.5 M.55,.5 L.7,.5 M.8,.5 L.95,.5" }, "┉": { 3: "M.05,.5 L.2,.5 M.3,.5 L.45,.5 M.55,.5 L.7,.5 M.8,.5 L.95,.5" }, "╎": { 1: "M.5,.1 L.5,.4 M.5,.6 L.5,.9" }, "╏": { 3: "M.5,.1 L.5,.4 M.5,.6 L.5,.9" }, "┆": { 1: "M.5,.0667 L.5,.2667 M.5,.4 L.5,.6 M.5,.7333 L.5,.9333" }, "┇": { 3: "M.5,.0667 L.5,.2667 M.5,.4 L.5,.6 M.5,.7333 L.5,.9333" }, "┊": { 1: "M.5,.05 L.5,.2 M.5,.3 L.5,.45 L.5,.55 M.5,.7 L.5,.95" }, "┋": { 3: "M.5,.05 L.5,.2 M.5,.3 L.5,.45 L.5,.55 M.5,.7 L.5,.95" }, "╭": { 1: (i2, e) => `M.5,1 L.5,${0.5 + e / 0.15 * 0.5} C.5,${0.5 + e / 0.15 * 0.5},.5,.5,1,.5` }, "╮": { 1: (i2, e) => `M.5,1 L.5,${0.5 + e / 0.15 * 0.5} C.5,${0.5 + e / 0.15 * 0.5},.5,.5,0,.5` }, "╯": { 1: (i2, e) => `M.5,0 L.5,${0.5 - e / 0.15 * 0.5} C.5,${0.5 - e / 0.15 * 0.5},.5,.5,0,.5` }, "╰": { 1: (i2, e) => `M.5,0 L.5,${0.5 - e / 0.15 * 0.5} C.5,${0.5 - e / 0.15 * 0.5},.5,.5,1,.5` } };
var et = { "": { d: "M.3,1 L.03,1 L.03,.88 C.03,.82,.06,.78,.11,.73 C.15,.7,.2,.68,.28,.65 L.43,.6 C.49,.58,.53,.56,.56,.53 C.59,.5,.6,.47,.6,.43 L.6,.27 L.4,.27 L.69,.1 L.98,.27 L.78,.27 L.78,.46 C.78,.52,.76,.56,.72,.61 C.68,.66,.63,.67,.56,.7 L.48,.72 C.42,.74,.38,.76,.35,.78 C.32,.8,.31,.84,.31,.88 L.31,1 M.3,.5 L.03,.59 L.03,.09 L.3,.09 L.3,.655", type: 0 }, "": { d: "M.7,.4 L.7,.47 L.2,.47 L.2,.03 L.355,.03 L.355,.4 L.705,.4 M.7,.5 L.86,.5 L.86,.95 L.69,.95 L.44,.66 L.46,.86 L.46,.95 L.3,.95 L.3,.49 L.46,.49 L.71,.78 L.69,.565 L.69,.5", type: 0 }, "": { d: "M.25,.94 C.16,.94,.11,.92,.11,.87 L.11,.53 C.11,.48,.15,.455,.23,.45 L.23,.3 C.23,.25,.26,.22,.31,.19 C.36,.16,.43,.15,.51,.15 C.59,.15,.66,.16,.71,.19 C.77,.22,.79,.26,.79,.3 L.79,.45 C.87,.45,.91,.48,.91,.53 L.91,.87 C.91,.92,.86,.94,.77,.94 L.24,.94 M.53,.2 C.49,.2,.45,.21,.42,.23 C.39,.25,.38,.27,.38,.3 L.38,.45 L.68,.45 L.68,.3 C.68,.27,.67,.25,.64,.23 C.61,.21,.58,.2,.53,.2 M.58,.82 L.58,.66 C.63,.65,.65,.63,.65,.6 C.65,.58,.64,.57,.61,.56 C.58,.55,.56,.54,.52,.54 C.48,.54,.46,.55,.43,.56 C.4,.57,.39,.59,.39,.6 C.39,.63,.41,.64,.46,.66 L.46,.82 L.57,.82", type: 0 }, "": { d: "M0,0 L1,.5 L0,1", type: 0, rightPadding: 2 }, "": { d: "M-1,-.5 L1,.5 L-1,1.5", type: 1, leftPadding: 1, rightPadding: 1 }, "": { d: "M1,0 L0,.5 L1,1", type: 0, leftPadding: 2 }, "": { d: "M2,-.5 L0,.5 L2,1.5", type: 1, leftPadding: 1, rightPadding: 1 }, "": { d: "M0,0 L0,1 C0.552,1,1,0.776,1,.5 C1,0.224,0.552,0,0,0", type: 0, rightPadding: 1 }, "": { d: "M.2,1 C.422,1,.8,.826,.78,.5 C.8,.174,0.422,0,.2,0", type: 1, rightPadding: 1 }, "": { d: "M1,0 L1,1 C0.448,1,0,0.776,0,.5 C0,0.224,0.448,0,1,0", type: 0, leftPadding: 1 }, "": { d: "M.8,1 C0.578,1,0.2,.826,.22,.5 C0.2,0.174,0.578,0,0.8,0", type: 1, leftPadding: 1 }, "": { d: "M-.5,-.5 L1.5,1.5 L-.5,1.5", type: 0 }, "": { d: "M-.5,-.5 L1.5,1.5", type: 1, leftPadding: 1, rightPadding: 1 }, "": { d: "M1.5,-.5 L-.5,1.5 L1.5,1.5", type: 0 }, "": { d: "M1.5,-.5 L-.5,1.5 L-.5,-.5", type: 0 }, "": { d: "M1.5,-.5 L-.5,1.5", type: 1, leftPadding: 1, rightPadding: 1 }, "": { d: "M-.5,-.5 L1.5,1.5 L1.5,-.5", type: 0 } };
et[""] = et[""];
et[""] = et[""];
function yn(i2, e, t, n, s, o, r, a) {
  let l = Hr[e];
  if (l)
    return $r(i2, l, t, n, s, o), true;
  let u = Wr[e];
  if (u)
    return Kr(i2, u, t, n, s, o), true;
  let c = Gr[e];
  if (c)
    return Vr(i2, c, t, n, s, o, a), true;
  let d = et[e];
  return d ? (Cr(i2, d, t, n, s, o, r, a), true) : false;
}
function $r(i2, e, t, n, s, o) {
  for (let r = 0;r < e.length; r++) {
    let a = e[r], l = s / 8, u = o / 8;
    i2.fillRect(t + a.x * l, n + a.y * u, a.w * l, a.h * u);
  }
}
var xn = new Map;
function Kr(i2, e, t, n, s, o) {
  let r = xn.get(e);
  r || (r = new Map, xn.set(e, r));
  let a = i2.fillStyle;
  if (typeof a != "string")
    throw new Error(`Unexpected fillStyle type "${a}"`);
  let l = r.get(a);
  if (!l) {
    let u = e[0].length, c = e.length, d = i2.canvas.ownerDocument.createElement("canvas");
    d.width = u, d.height = c;
    let h = F(d.getContext("2d")), f = new ImageData(u, c), I, L, M, q;
    if (a.startsWith("#"))
      I = parseInt(a.slice(1, 3), 16), L = parseInt(a.slice(3, 5), 16), M = parseInt(a.slice(5, 7), 16), q = a.length > 7 && parseInt(a.slice(7, 9), 16) || 1;
    else if (a.startsWith("rgba"))
      [I, L, M, q] = a.substring(5, a.length - 1).split(",").map((S) => parseFloat(S));
    else
      throw new Error(`Unexpected fillStyle color format "${a}" when drawing pattern glyph`);
    for (let S = 0;S < c; S++)
      for (let W = 0;W < u; W++)
        f.data[(S * u + W) * 4] = I, f.data[(S * u + W) * 4 + 1] = L, f.data[(S * u + W) * 4 + 2] = M, f.data[(S * u + W) * 4 + 3] = e[S][W] * (q * 255);
    h.putImageData(f, 0, 0), l = F(i2.createPattern(d, null)), r.set(a, l);
  }
  i2.fillStyle = l, i2.fillRect(t, n, s, o);
}
function Vr(i2, e, t, n, s, o, r) {
  i2.strokeStyle = i2.fillStyle;
  for (let [a, l] of Object.entries(e)) {
    i2.beginPath(), i2.lineWidth = r * Number.parseInt(a);
    let u;
    if (typeof l == "function") {
      let d = 0.15 / o * s;
      u = l(0.15, d);
    } else
      u = l;
    for (let c of u.split(" ")) {
      let d = c[0], h = In[d];
      if (!h) {
        console.error(`Could not find drawing instructions for "${d}"`);
        continue;
      }
      let f = c.substring(1).split(",");
      !f[0] || !f[1] || h(i2, Ln(f, s, o, t, n, true, r));
    }
    i2.stroke(), i2.closePath();
  }
}
function Cr(i2, e, t, n, s, o, r, a) {
  let l = new Path2D;
  l.rect(t, n, s, o), i2.clip(l), i2.beginPath();
  let u = r / 12;
  i2.lineWidth = a * u;
  for (let c of e.d.split(" ")) {
    let d = c[0], h = In[d];
    if (!h) {
      console.error(`Could not find drawing instructions for "${d}"`);
      continue;
    }
    let f = c.substring(1).split(",");
    !f[0] || !f[1] || h(i2, Ln(f, s, o, t, n, false, a, (e.leftPadding ?? 0) * (u / 2), (e.rightPadding ?? 0) * (u / 2)));
  }
  e.type === 1 ? (i2.strokeStyle = i2.fillStyle, i2.stroke()) : i2.fill(), i2.closePath();
}
function En(i2, e, t = 0) {
  return Math.max(Math.min(i2, e), t);
}
var In = { C: (i2, e) => i2.bezierCurveTo(e[0], e[1], e[2], e[3], e[4], e[5]), L: (i2, e) => i2.lineTo(e[0], e[1]), M: (i2, e) => i2.moveTo(e[0], e[1]) };
function Ln(i2, e, t, n, s, o, r, a = 0, l = 0) {
  let u = i2.map((c) => parseFloat(c) || parseInt(c));
  if (u.length < 2)
    throw new Error("Too few arguments for instruction");
  for (let c = 0;c < u.length; c += 2)
    u[c] *= e - a * r - l * r, o && u[c] !== 0 && (u[c] = En(Math.round(u[c] + 0.5) - 0.5, e, 0)), u[c] += n + a * r;
  for (let c = 1;c < u.length; c += 2)
    u[c] *= t, o && u[c] !== 0 && (u[c] = En(Math.round(u[c] + 0.5) - 0.5, t, 0)), u[c] += s;
  return u;
}
var Ot = class {
  constructor() {
    this._data = {};
  }
  set(e, t, n) {
    this._data[e] || (this._data[e] = {}), this._data[e][t] = n;
  }
  get(e, t) {
    return this._data[e] ? this._data[e][t] : undefined;
  }
  clear() {
    this._data = {};
  }
};
var tt = class {
  constructor() {
    this._data = new Ot;
  }
  set(e, t, n, s, o) {
    this._data.get(e, t) || this._data.set(e, t, new Ot), this._data.get(e, t).set(n, s, o);
  }
  get(e, t, n, s) {
    return this._data.get(e, t)?.get(n, s);
  }
  clear() {
    this._data.clear();
  }
};
var Ft = class {
  constructor() {
    this._tasks = [];
    this._i = 0;
  }
  enqueue(e) {
    this._tasks.push(e), this._start();
  }
  flush() {
    for (;this._i < this._tasks.length; )
      this._tasks[this._i]() || this._i++;
    this.clear();
  }
  clear() {
    this._idleCallback && (this._cancelCallback(this._idleCallback), this._idleCallback = undefined), this._i = 0, this._tasks.length = 0;
  }
  _start() {
    this._idleCallback || (this._idleCallback = this._requestCallback(this._process.bind(this)));
  }
  _process(e) {
    this._idleCallback = undefined;
    let t = 0, n = 0, s = e.timeRemaining(), o = 0;
    for (;this._i < this._tasks.length; ) {
      if (t = performance.now(), this._tasks[this._i]() || this._i++, t = Math.max(1, performance.now() - t), n = Math.max(t, n), o = e.timeRemaining(), n * 1.5 > o) {
        s - t < -20 && console.warn(`task queue exceeded allotted deadline by ${Math.abs(Math.round(s - t))}ms`), this._start();
        return;
      }
      s = o;
    }
    this.clear();
  }
};
var gi = class extends Ft {
  _requestCallback(e) {
    return setTimeout(() => e(this._createDeadline(16)));
  }
  _cancelCallback(e) {
    clearTimeout(e);
  }
  _createDeadline(e) {
    let t = performance.now() + e;
    return { timeRemaining: () => Math.max(0, t - performance.now()) };
  }
};
var xi = class extends Ft {
  _requestCallback(e) {
    return requestIdleCallback(e);
  }
  _cancelCallback(e) {
    cancelIdleCallback(e);
  }
};
var wn = !Lt && "requestIdleCallback" in window ? xi : gi;
var he = class i2 {
  constructor() {
    this.fg = 0;
    this.bg = 0;
    this.extended = new it;
  }
  static toColorRGB(e) {
    return [e >>> 16 & 255, e >>> 8 & 255, e & 255];
  }
  static fromColorRGB(e) {
    return (e[0] & 255) << 16 | (e[1] & 255) << 8 | e[2] & 255;
  }
  clone() {
    let e = new i2;
    return e.fg = this.fg, e.bg = this.bg, e.extended = this.extended.clone(), e;
  }
  isInverse() {
    return this.fg & 67108864;
  }
  isBold() {
    return this.fg & 134217728;
  }
  isUnderline() {
    return this.hasExtendedAttrs() && this.extended.underlineStyle !== 0 ? 1 : this.fg & 268435456;
  }
  isBlink() {
    return this.fg & 536870912;
  }
  isInvisible() {
    return this.fg & 1073741824;
  }
  isItalic() {
    return this.bg & 67108864;
  }
  isDim() {
    return this.bg & 134217728;
  }
  isStrikethrough() {
    return this.fg & 2147483648;
  }
  isProtected() {
    return this.bg & 536870912;
  }
  isOverline() {
    return this.bg & 1073741824;
  }
  getFgColorMode() {
    return this.fg & 50331648;
  }
  getBgColorMode() {
    return this.bg & 50331648;
  }
  isFgRGB() {
    return (this.fg & 50331648) === 50331648;
  }
  isBgRGB() {
    return (this.bg & 50331648) === 50331648;
  }
  isFgPalette() {
    return (this.fg & 50331648) === 16777216 || (this.fg & 50331648) === 33554432;
  }
  isBgPalette() {
    return (this.bg & 50331648) === 16777216 || (this.bg & 50331648) === 33554432;
  }
  isFgDefault() {
    return (this.fg & 50331648) === 0;
  }
  isBgDefault() {
    return (this.bg & 50331648) === 0;
  }
  isAttributeDefault() {
    return this.fg === 0 && this.bg === 0;
  }
  getFgColor() {
    switch (this.fg & 50331648) {
      case 16777216:
      case 33554432:
        return this.fg & 255;
      case 50331648:
        return this.fg & 16777215;
      default:
        return -1;
    }
  }
  getBgColor() {
    switch (this.bg & 50331648) {
      case 16777216:
      case 33554432:
        return this.bg & 255;
      case 50331648:
        return this.bg & 16777215;
      default:
        return -1;
    }
  }
  hasExtendedAttrs() {
    return this.bg & 268435456;
  }
  updateExtended() {
    this.extended.isEmpty() ? this.bg &= -268435457 : this.bg |= 268435456;
  }
  getUnderlineColor() {
    if (this.bg & 268435456 && ~this.extended.underlineColor)
      switch (this.extended.underlineColor & 50331648) {
        case 16777216:
        case 33554432:
          return this.extended.underlineColor & 255;
        case 50331648:
          return this.extended.underlineColor & 16777215;
        default:
          return this.getFgColor();
      }
    return this.getFgColor();
  }
  getUnderlineColorMode() {
    return this.bg & 268435456 && ~this.extended.underlineColor ? this.extended.underlineColor & 50331648 : this.getFgColorMode();
  }
  isUnderlineColorRGB() {
    return this.bg & 268435456 && ~this.extended.underlineColor ? (this.extended.underlineColor & 50331648) === 50331648 : this.isFgRGB();
  }
  isUnderlineColorPalette() {
    return this.bg & 268435456 && ~this.extended.underlineColor ? (this.extended.underlineColor & 50331648) === 16777216 || (this.extended.underlineColor & 50331648) === 33554432 : this.isFgPalette();
  }
  isUnderlineColorDefault() {
    return this.bg & 268435456 && ~this.extended.underlineColor ? (this.extended.underlineColor & 50331648) === 0 : this.isFgDefault();
  }
  getUnderlineStyle() {
    return this.fg & 268435456 ? this.bg & 268435456 ? this.extended.underlineStyle : 1 : 0;
  }
  getUnderlineVariantOffset() {
    return this.extended.underlineVariantOffset;
  }
};
var it = class i3 {
  constructor(e = 0, t = 0) {
    this._ext = 0;
    this._urlId = 0;
    this._ext = e, this._urlId = t;
  }
  get ext() {
    return this._urlId ? this._ext & -469762049 | this.underlineStyle << 26 : this._ext;
  }
  set ext(e) {
    this._ext = e;
  }
  get underlineStyle() {
    return this._urlId ? 5 : (this._ext & 469762048) >> 26;
  }
  set underlineStyle(e) {
    this._ext &= -469762049, this._ext |= e << 26 & 469762048;
  }
  get underlineColor() {
    return this._ext & 67108863;
  }
  set underlineColor(e) {
    this._ext &= -67108864, this._ext |= e & 67108863;
  }
  get urlId() {
    return this._urlId;
  }
  set urlId(e) {
    this._urlId = e;
  }
  get underlineVariantOffset() {
    let e = (this._ext & 3758096384) >> 29;
    return e < 0 ? e ^ 4294967288 : e;
  }
  set underlineVariantOffset(e) {
    this._ext &= 536870911, this._ext |= e << 29 & 3758096384;
  }
  clone() {
    return new i3(this._ext, this._urlId);
  }
  isEmpty() {
    return this.underlineStyle === 0 && this._urlId === 0;
  }
};
var He = class He2 {
  constructor(e) {
    this.element = e, this.next = He2.Undefined, this.prev = He2.Undefined;
  }
};
He.Undefined = new He(undefined);
var zr = globalThis.performance && typeof globalThis.performance.now == "function";
var kt = class i4 {
  static create(e) {
    return new i4(e);
  }
  constructor(e) {
    this._now = zr && e === false ? Date.now : globalThis.performance.now.bind(globalThis.performance), this._startTime = this._now(), this._stopTime = -1;
  }
  stop() {
    this._stopTime = this._now();
  }
  reset() {
    this._startTime = this._now(), this._stopTime = -1;
  }
  elapsed() {
    return this._stopTime !== -1 ? this._stopTime - this._startTime : this._now() - this._startTime;
  }
};
var qr = false;
var Dn = false;
var jr = false;
var ee;
((se) => {
  se.None = () => B.None;
  function e(v) {
    if (jr) {
      let { onDidAddListener: p } = v, g = nt.create(), b = 0;
      v.onDidAddListener = () => {
        ++b === 2 && (console.warn("snapshotted emitter LIKELY used public and SHOULD HAVE BEEN created with DisposableStore. snapshotted here"), g.print()), p?.();
      };
    }
  }
  function t(v, p) {
    return h(v, () => {}, 0, undefined, true, undefined, p);
  }
  se.defer = t;
  function n(v) {
    return (p, g = null, b) => {
      let m = false, _;
      return _ = v((T) => {
        if (!m)
          return _ ? _.dispose() : m = true, p.call(g, T);
      }, null, b), m && _.dispose(), _;
    };
  }
  se.once = n;
  function s(v, p, g) {
    return c((b, m = null, _) => v((T) => b.call(m, p(T)), null, _), g);
  }
  se.map = s;
  function o(v, p, g) {
    return c((b, m = null, _) => v((T) => {
      p(T), b.call(m, T);
    }, null, _), g);
  }
  se.forEach = o;
  function r(v, p, g) {
    return c((b, m = null, _) => v((T) => p(T) && b.call(m, T), null, _), g);
  }
  se.filter = r;
  function a(v) {
    return v;
  }
  se.signal = a;
  function l(...v) {
    return (p, g = null, b) => {
      let m = It(...v.map((_) => _((T) => p.call(g, T))));
      return d(m, b);
    };
  }
  se.any = l;
  function u(v, p, g, b) {
    let m = g;
    return s(v, (_) => (m = p(m, _), m), b);
  }
  se.reduce = u;
  function c(v, p) {
    let g, b = { onWillAddFirstListener() {
      g = v(m.fire, m);
    }, onDidRemoveLastListener() {
      g?.dispose();
    } };
    p || e(b);
    let m = new D(b);
    return p?.add(m), m.event;
  }
  function d(v, p) {
    return p instanceof Array ? p.push(v) : p && p.add(v), v;
  }
  function h(v, p, g = 100, b = false, m = false, _, T) {
    let x, R, $, P = 0, de, Re = { leakWarningThreshold: _, onWillAddFirstListener() {
      x = v((ie) => {
        P++, R = p(R, ie), b && !$ && (oe.fire(R), R = undefined), de = () => {
          let N = R;
          R = undefined, $ = undefined, (!b || P > 1) && oe.fire(N), P = 0;
        }, typeof g == "number" ? (clearTimeout($), $ = setTimeout(de, g)) : $ === undefined && ($ = 0, queueMicrotask(de));
      });
    }, onWillRemoveListener() {
      m && P > 0 && de?.();
    }, onDidRemoveLastListener() {
      de = undefined, x.dispose();
    } };
    T || e(Re);
    let oe = new D(Re);
    return T?.add(oe), oe.event;
  }
  se.debounce = h;
  function f(v, p = 0, g) {
    return se.debounce(v, (b, m) => b ? (b.push(m), b) : [m], p, undefined, true, undefined, g);
  }
  se.accumulate = f;
  function I(v, p = (b, m) => b === m, g) {
    let b = true, m;
    return r(v, (_) => {
      let T = b || !p(_, m);
      return b = false, m = _, T;
    }, g);
  }
  se.latch = I;
  function L(v, p, g) {
    return [se.filter(v, p, g), se.filter(v, (b) => !p(b), g)];
  }
  se.split = L;
  function M(v, p = false, g = [], b) {
    let m = g.slice(), _ = v((R) => {
      m ? m.push(R) : x.fire(R);
    });
    b && b.add(_);
    let T = () => {
      m?.forEach((R) => x.fire(R)), m = null;
    }, x = new D({ onWillAddFirstListener() {
      _ || (_ = v((R) => x.fire(R)), b && b.add(_));
    }, onDidAddFirstListener() {
      m && (p ? setTimeout(T) : T());
    }, onDidRemoveLastListener() {
      _ && _.dispose(), _ = null;
    } });
    return b && b.add(x), x.event;
  }
  se.buffer = M;
  function q(v, p) {
    return (b, m, _) => {
      let T = p(new W);
      return v(function(x) {
        let R = T.evaluate(x);
        R !== S && b.call(m, R);
      }, undefined, _);
    };
  }
  se.chain = q;
  let S = Symbol("HaltChainable");

  class W {
    constructor() {
      this.steps = [];
    }
    map(p) {
      return this.steps.push(p), this;
    }
    forEach(p) {
      return this.steps.push((g) => (p(g), g)), this;
    }
    filter(p) {
      return this.steps.push((g) => p(g) ? g : S), this;
    }
    reduce(p, g) {
      let b = g;
      return this.steps.push((m) => (b = p(b, m), b)), this;
    }
    latch(p = (g, b) => g === b) {
      let g = true, b;
      return this.steps.push((m) => {
        let _ = g || !p(m, b);
        return g = false, b = m, _ ? m : S;
      }), this;
    }
    evaluate(p) {
      for (let g of this.steps)
        if (p = g(p), p === S)
          break;
      return p;
    }
  }
  function E(v, p, g = (b) => b) {
    let b = (...x) => T.fire(g(...x)), m = () => v.on(p, b), _ = () => v.removeListener(p, b), T = new D({ onWillAddFirstListener: m, onDidRemoveLastListener: _ });
    return T.event;
  }
  se.fromNodeEventEmitter = E;
  function y(v, p, g = (b) => b) {
    let b = (...x) => T.fire(g(...x)), m = () => v.addEventListener(p, b), _ = () => v.removeEventListener(p, b), T = new D({ onWillAddFirstListener: m, onDidRemoveLastListener: _ });
    return T.event;
  }
  se.fromDOMEventEmitter = y;
  function w(v) {
    return new Promise((p) => n(v)(p));
  }
  se.toPromise = w;
  function G(v) {
    let p = new D;
    return v.then((g) => {
      p.fire(g);
    }, () => {
      p.fire(undefined);
    }).finally(() => {
      p.dispose();
    }), p.event;
  }
  se.fromPromise = G;
  function ue(v, p) {
    return v((g) => p.fire(g));
  }
  se.forward = ue;
  function Se(v, p, g) {
    return p(g), v((b) => p(b));
  }
  se.runAndSubscribe = Se;

  class ce {
    constructor(p, g) {
      this._observable = p;
      this._counter = 0;
      this._hasChanged = false;
      let b = { onWillAddFirstListener: () => {
        p.addObserver(this);
      }, onDidRemoveLastListener: () => {
        p.removeObserver(this);
      } };
      g || e(b), this.emitter = new D(b), g && g.add(this.emitter);
    }
    beginUpdate(p) {
      this._counter++;
    }
    handlePossibleChange(p) {}
    handleChange(p, g) {
      this._hasChanged = true;
    }
    endUpdate(p) {
      this._counter--, this._counter === 0 && (this._observable.reportChanges(), this._hasChanged && (this._hasChanged = false, this.emitter.fire(this._observable.get())));
    }
  }
  function we(v, p) {
    return new ce(v, p).emitter.event;
  }
  se.fromObservable = we;
  function A(v) {
    return (p, g, b) => {
      let m = 0, _ = false, T = { beginUpdate() {
        m++;
      }, endUpdate() {
        m--, m === 0 && (v.reportChanges(), _ && (_ = false, p.call(g)));
      }, handlePossibleChange() {}, handleChange() {
        _ = true;
      } };
      v.addObserver(T), v.reportChanges();
      let x = { dispose() {
        v.removeObserver(T);
      } };
      return b instanceof fe ? b.add(x) : Array.isArray(b) && b.push(x), x;
    };
  }
  se.fromObservableLight = A;
})(ee ||= {});
var We = class We2 {
  constructor(e) {
    this.listenerCount = 0;
    this.invocationCount = 0;
    this.elapsedOverall = 0;
    this.durations = [];
    this.name = `${e}_${We2._idPool++}`, We2.all.add(this);
  }
  start(e) {
    this._stopWatch = new kt, this.listenerCount = e;
  }
  stop() {
    if (this._stopWatch) {
      let e = this._stopWatch.elapsed();
      this.durations.push(e), this.elapsedOverall += e, this.invocationCount += 1, this._stopWatch = undefined;
    }
  }
};
We.all = new Set, We._idPool = 0;
var Ei = We;
var Mn = -1;
var Bt = class Bt2 {
  constructor(e, t, n = (Bt2._idPool++).toString(16).padStart(3, "0")) {
    this._errorHandler = e;
    this.threshold = t;
    this.name = n;
    this._warnCountdown = 0;
  }
  dispose() {
    this._stacks?.clear();
  }
  check(e, t) {
    let n = this.threshold;
    if (n <= 0 || t < n)
      return;
    this._stacks || (this._stacks = new Map);
    let s = this._stacks.get(e.value) || 0;
    if (this._stacks.set(e.value, s + 1), this._warnCountdown -= 1, this._warnCountdown <= 0) {
      this._warnCountdown = n * 0.5;
      let [o, r] = this.getMostFrequentStack(), a = `[${this.name}] potential listener LEAK detected, having ${t} listeners already. MOST frequent listener (${r}):`;
      console.warn(a), console.warn(o);
      let l = new Ii(a, o);
      this._errorHandler(l);
    }
    return () => {
      let o = this._stacks.get(e.value) || 0;
      this._stacks.set(e.value, o - 1);
    };
  }
  getMostFrequentStack() {
    if (!this._stacks)
      return;
    let e, t = 0;
    for (let [n, s] of this._stacks)
      (!e || t < s) && (e = [n, s], t = s);
    return e;
  }
};
Bt._idPool = 1;
var yi = Bt;
var nt = class i5 {
  constructor(e) {
    this.value = e;
  }
  static create() {
    let e = new Error;
    return new i5(e.stack ?? "");
  }
  print() {
    console.warn(this.value.split(`
`).slice(2).join(`
`));
  }
};
var Ii = class extends Error {
  constructor(e, t) {
    super(e), this.name = "ListenerLeakError", this.stack = t;
  }
};
var Li = class extends Error {
  constructor(e, t) {
    super(e), this.name = "ListenerRefusalError", this.stack = t;
  }
};
var Xr = 0;
var Ge = class {
  constructor(e) {
    this.value = e;
    this.id = Xr++;
  }
};
var Yr = 2;
var Qr = (i6, e) => {
  if (i6 instanceof Ge)
    e(i6);
  else
    for (let t = 0;t < i6.length; t++) {
      let n = i6[t];
      n && e(n);
    }
};
var Pt;
if (qr) {
  let i6 = [];
  setInterval(() => {
    i6.length !== 0 && (console.warn("[LEAKING LISTENERS] GC'ed these listeners that were NOT yet disposed:"), console.warn(i6.join(`
`)), i6.length = 0);
  }, 3000), Pt = new FinalizationRegistry((e) => {
    typeof e == "string" && i6.push(e);
  });
}
var D = class {
  constructor(e) {
    this._size = 0;
    this._options = e, this._leakageMon = Mn > 0 || this._options?.leakWarningThreshold ? new yi(e?.onListenerError ?? Pe, this._options?.leakWarningThreshold ?? Mn) : undefined, this._perfMon = this._options?._profName ? new Ei(this._options._profName) : undefined, this._deliveryQueue = this._options?.deliveryQueue;
  }
  dispose() {
    if (!this._disposed) {
      if (this._disposed = true, this._deliveryQueue?.current === this && this._deliveryQueue.reset(), this._listeners) {
        if (Dn) {
          let e = this._listeners;
          queueMicrotask(() => {
            Qr(e, (t) => t.stack?.print());
          });
        }
        this._listeners = undefined, this._size = 0;
      }
      this._options?.onDidRemoveLastListener?.(), this._leakageMon?.dispose();
    }
  }
  get event() {
    return this._event ??= (e, t, n) => {
      if (this._leakageMon && this._size > this._leakageMon.threshold ** 2) {
        let l = `[${this._leakageMon.name}] REFUSES to accept new listeners because it exceeded its threshold by far (${this._size} vs ${this._leakageMon.threshold})`;
        console.warn(l);
        let u = this._leakageMon.getMostFrequentStack() ?? ["UNKNOWN stack", -1], c = new Li(`${l}. HINT: Stack shows most frequent listener (${u[1]}-times)`, u[0]);
        return (this._options?.onListenerError || Pe)(c), B.None;
      }
      if (this._disposed)
        return B.None;
      t && (e = e.bind(t));
      let s = new Ge(e), o, r;
      this._leakageMon && this._size >= Math.ceil(this._leakageMon.threshold * 0.2) && (s.stack = nt.create(), o = this._leakageMon.check(s.stack, this._size + 1)), Dn && (s.stack = r ?? nt.create()), this._listeners ? this._listeners instanceof Ge ? (this._deliveryQueue ??= new wi, this._listeners = [this._listeners, s]) : this._listeners.push(s) : (this._options?.onWillAddFirstListener?.(this), this._listeners = s, this._options?.onDidAddFirstListener?.(this)), this._size++;
      let a = O(() => {
        Pt?.unregister(a), o?.(), this._removeListener(s);
      });
      if (n instanceof fe ? n.add(a) : Array.isArray(n) && n.push(a), Pt) {
        let l = new Error().stack.split(`
`).slice(2, 3).join(`
`).trim(), u = /(file:|vscode-file:\/\/vscode-app)?(\/[^:]*:\d+:\d+)/.exec(l);
        Pt.register(a, u?.[2] ?? l, a);
      }
      return a;
    }, this._event;
  }
  _removeListener(e) {
    if (this._options?.onWillRemoveListener?.(this), !this._listeners)
      return;
    if (this._size === 1) {
      this._listeners = undefined, this._options?.onDidRemoveLastListener?.(this), this._size = 0;
      return;
    }
    let t = this._listeners, n = t.indexOf(e);
    if (n === -1)
      throw console.log("disposed?", this._disposed), console.log("size?", this._size), console.log("arr?", JSON.stringify(this._listeners)), new Error("Attempted to dispose unknown listener");
    this._size--, t[n] = undefined;
    let s = this._deliveryQueue.current === this;
    if (this._size * Yr <= t.length) {
      let o = 0;
      for (let r = 0;r < t.length; r++)
        t[r] ? t[o++] = t[r] : s && (this._deliveryQueue.end--, o < this._deliveryQueue.i && this._deliveryQueue.i--);
      t.length = o;
    }
  }
  _deliver(e, t) {
    if (!e)
      return;
    let n = this._options?.onListenerError || Pe;
    if (!n) {
      e.value(t);
      return;
    }
    try {
      e.value(t);
    } catch (s) {
      n(s);
    }
  }
  _deliverQueue(e) {
    let t = e.current._listeners;
    for (;e.i < e.end; )
      this._deliver(t[e.i++], e.value);
    e.reset();
  }
  fire(e) {
    if (this._deliveryQueue?.current && (this._deliverQueue(this._deliveryQueue), this._perfMon?.stop()), this._perfMon?.start(this._size), this._listeners)
      if (this._listeners instanceof Ge)
        this._deliver(this._listeners, e);
      else {
        let t = this._deliveryQueue;
        t.enqueue(this, e, this._listeners.length), this._deliverQueue(t);
      }
    this._perfMon?.stop();
  }
  hasListeners() {
    return this._size > 0;
  }
};
var wi = class {
  constructor() {
    this.i = -1;
    this.end = 0;
  }
  enqueue(e, t, n) {
    this.i = 0, this.end = n, this.current = e, this.value = t;
  }
  reset() {
    this.i = this.end, this.current = undefined, this.value = undefined;
  }
};
var An = { texturePage: 0, texturePosition: { x: 0, y: 0 }, texturePositionClipSpace: { x: 0, y: 0 }, offset: { x: 0, y: 0 }, size: { x: 0, y: 0 }, sizeClipSpace: { x: 0, y: 0 } };
var rt = 2;
var st;
var ae = class i6 {
  constructor(e, t, n) {
    this._document = e;
    this._config = t;
    this._unicodeService = n;
    this._didWarmUp = false;
    this._cacheMap = new tt;
    this._cacheMapCombined = new tt;
    this._pages = [];
    this._activePages = [];
    this._workBoundingBox = { top: 0, left: 0, bottom: 0, right: 0 };
    this._workAttributeData = new he;
    this._textureSize = 512;
    this._onAddTextureAtlasCanvas = new D;
    this.onAddTextureAtlasCanvas = this._onAddTextureAtlasCanvas.event;
    this._onRemoveTextureAtlasCanvas = new D;
    this.onRemoveTextureAtlasCanvas = this._onRemoveTextureAtlasCanvas.event;
    this._requestClearModel = false;
    this._createNewPage(), this._tmpCanvas = Sn(e, this._config.deviceCellWidth * 4 + rt * 2, this._config.deviceCellHeight + rt * 2), this._tmpCtx = F(this._tmpCanvas.getContext("2d", { alpha: this._config.allowTransparency, willReadFrequently: true }));
  }
  get pages() {
    return this._pages;
  }
  dispose() {
    this._tmpCanvas.remove();
    for (let e of this.pages)
      e.canvas.remove();
    this._onAddTextureAtlasCanvas.dispose();
  }
  warmUp() {
    this._didWarmUp || (this._doWarmUp(), this._didWarmUp = true);
  }
  _doWarmUp() {
    let e = new wn;
    for (let t = 33;t < 126; t++)
      e.enqueue(() => {
        if (!this._cacheMap.get(t, 0, 0, 0)) {
          let n = this._drawToCache(t, 0, 0, 0, false, undefined);
          this._cacheMap.set(t, 0, 0, 0, n);
        }
      });
  }
  beginFrame() {
    return this._requestClearModel;
  }
  clearTexture() {
    if (!(this._pages[0].currentRow.x === 0 && this._pages[0].currentRow.y === 0)) {
      for (let e of this._pages)
        e.clear();
      this._cacheMap.clear(), this._cacheMapCombined.clear(), this._didWarmUp = false;
    }
  }
  _createNewPage() {
    if (i6.maxAtlasPages && this._pages.length >= Math.max(4, i6.maxAtlasPages)) {
      let t = this._pages.filter((u) => u.canvas.width * 2 <= (i6.maxTextureSize || 4096)).sort((u, c) => c.canvas.width !== u.canvas.width ? c.canvas.width - u.canvas.width : c.percentageUsed - u.percentageUsed), n = -1, s = 0;
      for (let u = 0;u < t.length; u++)
        if (t[u].canvas.width !== s)
          n = u, s = t[u].canvas.width;
        else if (u - n === 3)
          break;
      let o = t.slice(n, n + 4), r = o.map((u) => u.glyphs[0].texturePage).sort((u, c) => u > c ? 1 : -1), a = this.pages.length - o.length, l = this._mergePages(o, a);
      l.version++;
      for (let u = r.length - 1;u >= 0; u--)
        this._deletePage(r[u]);
      this.pages.push(l), this._requestClearModel = true, this._onAddTextureAtlasCanvas.fire(l.canvas);
    }
    let e = new ot(this._document, this._textureSize);
    return this._pages.push(e), this._activePages.push(e), this._onAddTextureAtlasCanvas.fire(e.canvas), e;
  }
  _mergePages(e, t) {
    let n = e[0].canvas.width * 2, s = new ot(this._document, n, e);
    for (let [o, r] of e.entries()) {
      let a = o * r.canvas.width % n, l = Math.floor(o / 2) * r.canvas.height;
      s.ctx.drawImage(r.canvas, a, l);
      for (let c of r.glyphs)
        c.texturePage = t, c.sizeClipSpace.x = c.size.x / n, c.sizeClipSpace.y = c.size.y / n, c.texturePosition.x += a, c.texturePosition.y += l, c.texturePositionClipSpace.x = c.texturePosition.x / n, c.texturePositionClipSpace.y = c.texturePosition.y / n;
      this._onRemoveTextureAtlasCanvas.fire(r.canvas);
      let u = this._activePages.indexOf(r);
      u !== -1 && this._activePages.splice(u, 1);
    }
    return s;
  }
  _deletePage(e) {
    this._pages.splice(e, 1);
    for (let t = e;t < this._pages.length; t++) {
      let n = this._pages[t];
      for (let s of n.glyphs)
        s.texturePage--;
      n.version++;
    }
  }
  getRasterizedGlyphCombinedChar(e, t, n, s, o, r) {
    return this._getFromCacheMap(this._cacheMapCombined, e, t, n, s, o, r);
  }
  getRasterizedGlyph(e, t, n, s, o, r) {
    return this._getFromCacheMap(this._cacheMap, e, t, n, s, o, r);
  }
  _getFromCacheMap(e, t, n, s, o, r, a) {
    return st = e.get(t, n, s, o), st || (st = this._drawToCache(t, n, s, o, r, a), e.set(t, n, s, o, st)), st;
  }
  _getColorFromAnsiIndex(e) {
    if (e >= this._config.colors.ansi.length)
      throw new Error("No color found for idx " + e);
    return this._config.colors.ansi[e];
  }
  _getBackgroundColor(e, t, n, s) {
    if (this._config.allowTransparency)
      return Z;
    let o;
    switch (e) {
      case 16777216:
      case 33554432:
        o = this._getColorFromAnsiIndex(t);
        break;
      case 50331648:
        let r = he.toColorRGB(t);
        o = X.toColor(r[0], r[1], r[2]);
        break;
      case 0:
      default:
        n ? o = Ue.opaque(this._config.colors.foreground) : o = this._config.colors.background;
        break;
    }
    return this._config.allowTransparency || (o = Ue.opaque(o)), o;
  }
  _getForegroundColor(e, t, n, s, o, r, a, l, u, c) {
    let d = this._getMinimumContrastColor(e, t, n, s, o, r, a, u, l, c);
    if (d)
      return d;
    let h;
    switch (o) {
      case 16777216:
      case 33554432:
        this._config.drawBoldTextInBrightColors && u && r < 8 && (r += 8), h = this._getColorFromAnsiIndex(r);
        break;
      case 50331648:
        let f = he.toColorRGB(r);
        h = X.toColor(f[0], f[1], f[2]);
        break;
      case 0:
      default:
        a ? h = this._config.colors.background : h = this._config.colors.foreground;
    }
    return this._config.allowTransparency && (h = Ue.opaque(h)), l && (h = Ue.multiplyOpacity(h, gn)), h;
  }
  _resolveBackgroundRgba(e, t, n) {
    switch (e) {
      case 16777216:
      case 33554432:
        return this._getColorFromAnsiIndex(t).rgba;
      case 50331648:
        return t << 8;
      case 0:
      default:
        return n ? this._config.colors.foreground.rgba : this._config.colors.background.rgba;
    }
  }
  _resolveForegroundRgba(e, t, n, s) {
    switch (e) {
      case 16777216:
      case 33554432:
        return this._config.drawBoldTextInBrightColors && s && t < 8 && (t += 8), this._getColorFromAnsiIndex(t).rgba;
      case 50331648:
        return t << 8;
      case 0:
      default:
        return n ? this._config.colors.background.rgba : this._config.colors.foreground.rgba;
    }
  }
  _getMinimumContrastColor(e, t, n, s, o, r, a, l, u, c) {
    if (this._config.minimumContrastRatio === 1 || c)
      return;
    let d = this._getContrastCache(u), h = d.getColor(e, s);
    if (h !== undefined)
      return h || undefined;
    let f = this._resolveBackgroundRgba(t, n, a), I = this._resolveForegroundRgba(o, r, a, l), L = Te.ensureContrastRatio(f, I, this._config.minimumContrastRatio / (u ? 2 : 1));
    if (!L) {
      d.setColor(e, s, null);
      return;
    }
    let M = X.toColor(L >> 24 & 255, L >> 16 & 255, L >> 8 & 255);
    return d.setColor(e, s, M), M;
  }
  _getContrastCache(e) {
    return e ? this._config.colors.halfContrastCache : this._config.colors.contrastCache;
  }
  _drawToCache(e, t, n, s, o, r) {
    let a = typeof e == "number" ? String.fromCharCode(e) : e;
    r && this._tmpCanvas.parentElement !== r && (this._tmpCanvas.style.display = "none", r.append(this._tmpCanvas));
    let l = Math.min(this._config.deviceCellWidth * Math.max(a.length, 2) + rt * 2, this._config.deviceMaxTextureSize);
    this._tmpCanvas.width < l && (this._tmpCanvas.width = l);
    let u = Math.min(this._config.deviceCellHeight + rt * 4, this._textureSize);
    if (this._tmpCanvas.height < u && (this._tmpCanvas.height = u), this._tmpCtx.save(), this._workAttributeData.fg = n, this._workAttributeData.bg = t, this._workAttributeData.extended.ext = s, !!this._workAttributeData.isInvisible())
      return An;
    let d = !!this._workAttributeData.isBold(), h = !!this._workAttributeData.isInverse(), f = !!this._workAttributeData.isDim(), I = !!this._workAttributeData.isItalic(), L = !!this._workAttributeData.isUnderline(), M = !!this._workAttributeData.isStrikethrough(), q = !!this._workAttributeData.isOverline(), S = this._workAttributeData.getFgColor(), W = this._workAttributeData.getFgColorMode(), E = this._workAttributeData.getBgColor(), y = this._workAttributeData.getBgColorMode();
    if (h) {
      let x = S;
      S = E, E = x;
      let R = W;
      W = y, y = R;
    }
    let w = this._getBackgroundColor(y, E, h, f);
    this._tmpCtx.globalCompositeOperation = "copy", this._tmpCtx.fillStyle = w.css, this._tmpCtx.fillRect(0, 0, this._tmpCanvas.width, this._tmpCanvas.height), this._tmpCtx.globalCompositeOperation = "source-over";
    let G = d ? this._config.fontWeightBold : this._config.fontWeight, ue = I ? "italic" : "";
    this._tmpCtx.font = `${ue} ${G} ${this._config.fontSize * this._config.devicePixelRatio}px ${this._config.fontFamily}`, this._tmpCtx.textBaseline = St;
    let Se = a.length === 1 && Rt(a.charCodeAt(0)), ce = a.length === 1 && fn(a.charCodeAt(0)), we = this._getForegroundColor(t, y, E, n, W, S, h, f, d, Dt(a.charCodeAt(0)));
    this._tmpCtx.fillStyle = we.css;
    let A = ce ? 0 : rt * 2, se = false;
    this._config.customGlyphs !== false && (se = yn(this._tmpCtx, a, A, A, this._config.deviceCellWidth, this._config.deviceCellHeight, this._config.fontSize, this._config.devicePixelRatio));
    let v = !Se, p;
    if (typeof e == "number" ? p = this._unicodeService.wcwidth(e) : p = this._unicodeService.getStringCellWidth(e), L) {
      this._tmpCtx.save();
      let x = Math.max(1, Math.floor(this._config.fontSize * this._config.devicePixelRatio / 15)), R = x % 2 === 1 ? 0.5 : 0;
      if (this._tmpCtx.lineWidth = x, this._workAttributeData.isUnderlineColorDefault())
        this._tmpCtx.strokeStyle = this._tmpCtx.fillStyle;
      else if (this._workAttributeData.isUnderlineColorRGB())
        v = false, this._tmpCtx.strokeStyle = `rgb(${he.toColorRGB(this._workAttributeData.getUnderlineColor()).join(",")})`;
      else {
        v = false;
        let ie = this._workAttributeData.getUnderlineColor();
        this._config.drawBoldTextInBrightColors && this._workAttributeData.isBold() && ie < 8 && (ie += 8), this._tmpCtx.strokeStyle = this._getColorFromAnsiIndex(ie).css;
      }
      this._tmpCtx.beginPath();
      let $ = A, P = Math.ceil(A + this._config.deviceCharHeight) - R - (o ? x * 2 : 0), de = P + x, Re = P + x * 2, oe = this._workAttributeData.getUnderlineVariantOffset();
      for (let ie = 0;ie < p; ie++) {
        this._tmpCtx.save();
        let N = $ + ie * this._config.deviceCellWidth, ne = $ + (ie + 1) * this._config.deviceCellWidth, di = N + this._config.deviceCellWidth / 2;
        switch (this._workAttributeData.extended.underlineStyle) {
          case 2:
            this._tmpCtx.moveTo(N, P), this._tmpCtx.lineTo(ne, P), this._tmpCtx.moveTo(N, Re), this._tmpCtx.lineTo(ne, Re);
            break;
          case 3:
            let ft = x <= 1 ? Re : Math.ceil(A + this._config.deviceCharHeight - x / 2) - R, mt = x <= 1 ? P : Math.ceil(A + this._config.deviceCharHeight + x / 2) - R, qi = new Path2D;
            qi.rect(N, P, this._config.deviceCellWidth, Re - P), this._tmpCtx.clip(qi), this._tmpCtx.moveTo(N - this._config.deviceCellWidth / 2, de), this._tmpCtx.bezierCurveTo(N - this._config.deviceCellWidth / 2, mt, N, mt, N, de), this._tmpCtx.bezierCurveTo(N, ft, di, ft, di, de), this._tmpCtx.bezierCurveTo(di, mt, ne, mt, ne, de), this._tmpCtx.bezierCurveTo(ne, ft, ne + this._config.deviceCellWidth / 2, ft, ne + this._config.deviceCellWidth / 2, de);
            break;
          case 4:
            let _t = oe === 0 ? 0 : oe >= x ? x * 2 - oe : x - oe;
            !(oe >= x) === false || _t === 0 ? (this._tmpCtx.setLineDash([Math.round(x), Math.round(x)]), this._tmpCtx.moveTo(N + _t, P), this._tmpCtx.lineTo(ne, P)) : (this._tmpCtx.setLineDash([Math.round(x), Math.round(x)]), this._tmpCtx.moveTo(N, P), this._tmpCtx.lineTo(N + _t, P), this._tmpCtx.moveTo(N + _t + x, P), this._tmpCtx.lineTo(ne, P)), oe = bn(ne - N, x, oe);
            break;
          case 5:
            let Er = 0.6, yr = 0.3, hi = ne - N, ji = Math.floor(Er * hi), Xi = Math.floor(yr * hi), Ir = hi - ji - Xi;
            this._tmpCtx.setLineDash([ji, Xi, Ir]), this._tmpCtx.moveTo(N, P), this._tmpCtx.lineTo(ne, P);
            break;
          case 1:
          default:
            this._tmpCtx.moveTo(N, P), this._tmpCtx.lineTo(ne, P);
            break;
        }
        this._tmpCtx.stroke(), this._tmpCtx.restore();
      }
      if (this._tmpCtx.restore(), !se && this._config.fontSize >= 12 && !this._config.allowTransparency && a !== " ") {
        this._tmpCtx.save(), this._tmpCtx.textBaseline = "alphabetic";
        let ie = this._tmpCtx.measureText(a);
        if (this._tmpCtx.restore(), "actualBoundingBoxDescent" in ie && ie.actualBoundingBoxDescent > 0) {
          this._tmpCtx.save();
          let N = new Path2D;
          N.rect($, P - Math.ceil(x / 2), this._config.deviceCellWidth * p, Re - P + Math.ceil(x / 2)), this._tmpCtx.clip(N), this._tmpCtx.lineWidth = this._config.devicePixelRatio * 3, this._tmpCtx.strokeStyle = w.css, this._tmpCtx.strokeText(a, A, A + this._config.deviceCharHeight), this._tmpCtx.restore();
        }
      }
    }
    if (q) {
      let x = Math.max(1, Math.floor(this._config.fontSize * this._config.devicePixelRatio / 15)), R = x % 2 === 1 ? 0.5 : 0;
      this._tmpCtx.lineWidth = x, this._tmpCtx.strokeStyle = this._tmpCtx.fillStyle, this._tmpCtx.beginPath(), this._tmpCtx.moveTo(A, A + R), this._tmpCtx.lineTo(A + this._config.deviceCharWidth * p, A + R), this._tmpCtx.stroke();
    }
    if (se || this._tmpCtx.fillText(a, A, A + this._config.deviceCharHeight), a === "_" && !this._config.allowTransparency) {
      let x = Di(this._tmpCtx.getImageData(A, A, this._config.deviceCellWidth, this._config.deviceCellHeight), w, we, v);
      if (x)
        for (let R = 1;R <= 5 && (this._tmpCtx.save(), this._tmpCtx.fillStyle = w.css, this._tmpCtx.fillRect(0, 0, this._tmpCanvas.width, this._tmpCanvas.height), this._tmpCtx.restore(), this._tmpCtx.fillText(a, A, A + this._config.deviceCharHeight - R), x = Di(this._tmpCtx.getImageData(A, A, this._config.deviceCellWidth, this._config.deviceCellHeight), w, we, v), !!x); R++)
          ;
    }
    if (M) {
      let x = Math.max(1, Math.floor(this._config.fontSize * this._config.devicePixelRatio / 10)), R = this._tmpCtx.lineWidth % 2 === 1 ? 0.5 : 0;
      this._tmpCtx.lineWidth = x, this._tmpCtx.strokeStyle = this._tmpCtx.fillStyle, this._tmpCtx.beginPath(), this._tmpCtx.moveTo(A, A + Math.floor(this._config.deviceCharHeight / 2) - R), this._tmpCtx.lineTo(A + this._config.deviceCharWidth * p, A + Math.floor(this._config.deviceCharHeight / 2) - R), this._tmpCtx.stroke();
    }
    this._tmpCtx.restore();
    let g = this._tmpCtx.getImageData(0, 0, this._tmpCanvas.width, this._tmpCanvas.height), b;
    if (this._config.allowTransparency ? b = Jr(g) : b = Di(g, w, we, v), b)
      return An;
    let m = this._findGlyphBoundingBox(g, this._workBoundingBox, l, ce, se, A), _, T;
    for (;; ) {
      if (this._activePages.length === 0) {
        let x = this._createNewPage();
        _ = x, T = x.currentRow, T.height = m.size.y;
        break;
      }
      _ = this._activePages[this._activePages.length - 1], T = _.currentRow;
      for (let x of this._activePages)
        m.size.y <= x.currentRow.height && (_ = x, T = x.currentRow);
      for (let x = this._activePages.length - 1;x >= 0; x--)
        for (let R of this._activePages[x].fixedRows)
          R.height <= T.height && m.size.y <= R.height && (_ = this._activePages[x], T = R);
      if (m.size.x > this._textureSize) {
        this._overflowSizePage || (this._overflowSizePage = new ot(this._document, this._config.deviceMaxTextureSize), this.pages.push(this._overflowSizePage), this._requestClearModel = true, this._onAddTextureAtlasCanvas.fire(this._overflowSizePage.canvas)), _ = this._overflowSizePage, T = this._overflowSizePage.currentRow, T.x + m.size.x >= _.canvas.width && (T.x = 0, T.y += T.height, T.height = 0);
        break;
      }
      if (T.y + m.size.y >= _.canvas.height || T.height > m.size.y + 2) {
        let x = false;
        if (_.currentRow.y + _.currentRow.height + m.size.y >= _.canvas.height) {
          let R;
          for (let $ of this._activePages)
            if ($.currentRow.y + $.currentRow.height + m.size.y < $.canvas.height) {
              R = $;
              break;
            }
          if (R)
            _ = R;
          else if (i6.maxAtlasPages && this._pages.length >= i6.maxAtlasPages && T.y + m.size.y <= _.canvas.height && T.height >= m.size.y && T.x + m.size.x <= _.canvas.width)
            x = true;
          else {
            let $ = this._createNewPage();
            _ = $, T = $.currentRow, T.height = m.size.y, x = true;
          }
        }
        x || (_.currentRow.height > 0 && _.fixedRows.push(_.currentRow), T = { x: 0, y: _.currentRow.y + _.currentRow.height, height: m.size.y }, _.fixedRows.push(T), _.currentRow = { x: 0, y: T.y + T.height, height: 0 });
      }
      if (T.x + m.size.x <= _.canvas.width)
        break;
      T === _.currentRow ? (T.x = 0, T.y += T.height, T.height = 0) : _.fixedRows.splice(_.fixedRows.indexOf(T), 1);
    }
    return m.texturePage = this._pages.indexOf(_), m.texturePosition.x = T.x, m.texturePosition.y = T.y, m.texturePositionClipSpace.x = T.x / _.canvas.width, m.texturePositionClipSpace.y = T.y / _.canvas.height, m.sizeClipSpace.x /= _.canvas.width, m.sizeClipSpace.y /= _.canvas.height, T.height = Math.max(T.height, m.size.y), T.x += m.size.x, _.ctx.putImageData(g, m.texturePosition.x - this._workBoundingBox.left, m.texturePosition.y - this._workBoundingBox.top, this._workBoundingBox.left, this._workBoundingBox.top, m.size.x, m.size.y), _.addGlyph(m), _.version++, m;
  }
  _findGlyphBoundingBox(e, t, n, s, o, r) {
    t.top = 0;
    let a = s ? this._config.deviceCellHeight : this._tmpCanvas.height, l = s ? this._config.deviceCellWidth : n, u = false;
    for (let c = 0;c < a; c++) {
      for (let d = 0;d < l; d++) {
        let h = c * this._tmpCanvas.width * 4 + d * 4 + 3;
        if (e.data[h] !== 0) {
          t.top = c, u = true;
          break;
        }
      }
      if (u)
        break;
    }
    t.left = 0, u = false;
    for (let c = 0;c < r + l; c++) {
      for (let d = 0;d < a; d++) {
        let h = d * this._tmpCanvas.width * 4 + c * 4 + 3;
        if (e.data[h] !== 0) {
          t.left = c, u = true;
          break;
        }
      }
      if (u)
        break;
    }
    t.right = l, u = false;
    for (let c = r + l - 1;c >= r; c--) {
      for (let d = 0;d < a; d++) {
        let h = d * this._tmpCanvas.width * 4 + c * 4 + 3;
        if (e.data[h] !== 0) {
          t.right = c, u = true;
          break;
        }
      }
      if (u)
        break;
    }
    t.bottom = a, u = false;
    for (let c = a - 1;c >= 0; c--) {
      for (let d = 0;d < l; d++) {
        let h = c * this._tmpCanvas.width * 4 + d * 4 + 3;
        if (e.data[h] !== 0) {
          t.bottom = c, u = true;
          break;
        }
      }
      if (u)
        break;
    }
    return { texturePage: 0, texturePosition: { x: 0, y: 0 }, texturePositionClipSpace: { x: 0, y: 0 }, size: { x: t.right - t.left + 1, y: t.bottom - t.top + 1 }, sizeClipSpace: { x: t.right - t.left + 1, y: t.bottom - t.top + 1 }, offset: { x: -t.left + r + (s || o ? Math.floor((this._config.deviceCellWidth - this._config.deviceCharWidth) / 2) : 0), y: -t.top + r + (s || o ? this._config.lineHeight === 1 ? 0 : Math.round((this._config.deviceCellHeight - this._config.deviceCharHeight) / 2) : 0) } };
  }
};
var ot = class {
  constructor(e, t, n) {
    this._usedPixels = 0;
    this._glyphs = [];
    this.version = 0;
    this.currentRow = { x: 0, y: 0, height: 0 };
    this.fixedRows = [];
    if (n)
      for (let s of n)
        this._glyphs.push(...s.glyphs), this._usedPixels += s._usedPixels;
    this.canvas = Sn(e, t, t), this.ctx = F(this.canvas.getContext("2d", { alpha: true }));
  }
  get percentageUsed() {
    return this._usedPixels / (this.canvas.width * this.canvas.height);
  }
  get glyphs() {
    return this._glyphs;
  }
  addGlyph(e) {
    this._glyphs.push(e), this._usedPixels += e.size.x * e.size.y;
  }
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height), this.currentRow.x = 0, this.currentRow.y = 0, this.currentRow.height = 0, this.fixedRows.length = 0, this.version++;
  }
};
function Di(i7, e, t, n) {
  let s = e.rgba >>> 24, o = e.rgba >>> 16 & 255, r = e.rgba >>> 8 & 255, a = t.rgba >>> 24, l = t.rgba >>> 16 & 255, u = t.rgba >>> 8 & 255, c = Math.floor((Math.abs(s - a) + Math.abs(o - l) + Math.abs(r - u)) / 12), d = true;
  for (let h = 0;h < i7.data.length; h += 4)
    i7.data[h] === s && i7.data[h + 1] === o && i7.data[h + 2] === r || n && Math.abs(i7.data[h] - s) + Math.abs(i7.data[h + 1] - o) + Math.abs(i7.data[h + 2] - r) < c ? i7.data[h + 3] = 0 : d = false;
  return d;
}
function Jr(i7) {
  for (let e = 0;e < i7.data.length; e += 4)
    if (i7.data[e + 3] > 0)
      return false;
  return true;
}
function Sn(i7, e, t) {
  let n = i7.createElement("canvas");
  return n.width = e, n.height = t, n;
}
function On(i7, e, t, n, s, o, r, a) {
  let l = { foreground: o.foreground, background: o.background, cursor: Z, cursorAccent: Z, selectionForeground: Z, selectionBackgroundTransparent: Z, selectionBackgroundOpaque: Z, selectionInactiveBackgroundTransparent: Z, selectionInactiveBackgroundOpaque: Z, overviewRulerBorder: Z, scrollbarSliderBackground: Z, scrollbarSliderHoverBackground: Z, scrollbarSliderActiveBackground: Z, ansi: o.ansi.slice(), contrastCache: o.contrastCache, halfContrastCache: o.halfContrastCache };
  return { customGlyphs: s.customGlyphs, devicePixelRatio: r, deviceMaxTextureSize: a, letterSpacing: s.letterSpacing, lineHeight: s.lineHeight, deviceCellWidth: i7, deviceCellHeight: e, deviceCharWidth: t, deviceCharHeight: n, fontFamily: s.fontFamily, fontSize: s.fontSize, fontWeight: s.fontWeight, fontWeightBold: s.fontWeightBold, allowTransparency: s.allowTransparency, drawBoldTextInBrightColors: s.drawBoldTextInBrightColors, minimumContrastRatio: s.minimumContrastRatio, colors: l };
}
function Mi(i7, e) {
  for (let t = 0;t < i7.colors.ansi.length; t++)
    if (i7.colors.ansi[t].rgba !== e.colors.ansi[t].rgba)
      return false;
  return i7.devicePixelRatio === e.devicePixelRatio && i7.customGlyphs === e.customGlyphs && i7.lineHeight === e.lineHeight && i7.letterSpacing === e.letterSpacing && i7.fontFamily === e.fontFamily && i7.fontSize === e.fontSize && i7.fontWeight === e.fontWeight && i7.fontWeightBold === e.fontWeightBold && i7.allowTransparency === e.allowTransparency && i7.deviceCharWidth === e.deviceCharWidth && i7.deviceCharHeight === e.deviceCharHeight && i7.drawBoldTextInBrightColors === e.drawBoldTextInBrightColors && i7.minimumContrastRatio === e.minimumContrastRatio && i7.colors.foreground.rgba === e.colors.foreground.rgba && i7.colors.background.rgba === e.colors.background.rgba;
}
function Fn(i7) {
  return (i7 & 50331648) === 16777216 || (i7 & 50331648) === 33554432;
}
var le = [];
function Nt(i7, e, t, n, s, o, r, a, l) {
  let u = On(n, s, o, r, e, t, a, l);
  for (let h = 0;h < le.length; h++) {
    let f = le[h], I = f.ownedBy.indexOf(i7);
    if (I >= 0) {
      if (Mi(f.config, u))
        return f.atlas;
      f.ownedBy.length === 1 ? (f.atlas.dispose(), le.splice(h, 1)) : f.ownedBy.splice(I, 1);
      break;
    }
  }
  for (let h = 0;h < le.length; h++) {
    let f = le[h];
    if (Mi(f.config, u))
      return f.ownedBy.push(i7), f.atlas;
  }
  let c = i7._core, d = { atlas: new ae(document, u, c.unicodeService), config: u, ownedBy: [i7] };
  return le.push(d), d.atlas;
}
function Ai(i7) {
  for (let e = 0;e < le.length; e++) {
    let t = le[e].ownedBy.indexOf(i7);
    if (t !== -1) {
      le[e].ownedBy.length === 1 ? (le[e].atlas.dispose(), le.splice(e, 1)) : le[e].ownedBy.splice(t, 1);
      break;
    }
  }
}
var Ut = 600;
var Ht = class {
  constructor(e, t) {
    this._renderCallback = e;
    this._coreBrowserService = t;
    this.isCursorVisible = true, this._coreBrowserService.isFocused && this._restartInterval();
  }
  get isPaused() {
    return !(this._blinkStartTimeout || this._blinkInterval);
  }
  dispose() {
    this._blinkInterval && (this._coreBrowserService.window.clearInterval(this._blinkInterval), this._blinkInterval = undefined), this._blinkStartTimeout && (this._coreBrowserService.window.clearTimeout(this._blinkStartTimeout), this._blinkStartTimeout = undefined), this._animationFrame && (this._coreBrowserService.window.cancelAnimationFrame(this._animationFrame), this._animationFrame = undefined);
  }
  restartBlinkAnimation() {
    this.isPaused || (this._animationTimeRestarted = Date.now(), this.isCursorVisible = true, this._animationFrame || (this._animationFrame = this._coreBrowserService.window.requestAnimationFrame(() => {
      this._renderCallback(), this._animationFrame = undefined;
    })));
  }
  _restartInterval(e = Ut) {
    this._blinkInterval && (this._coreBrowserService.window.clearInterval(this._blinkInterval), this._blinkInterval = undefined), this._blinkStartTimeout = this._coreBrowserService.window.setTimeout(() => {
      if (this._animationTimeRestarted) {
        let t = Ut - (Date.now() - this._animationTimeRestarted);
        if (this._animationTimeRestarted = undefined, t > 0) {
          this._restartInterval(t);
          return;
        }
      }
      this.isCursorVisible = false, this._animationFrame = this._coreBrowserService.window.requestAnimationFrame(() => {
        this._renderCallback(), this._animationFrame = undefined;
      }), this._blinkInterval = this._coreBrowserService.window.setInterval(() => {
        if (this._animationTimeRestarted) {
          let t = Ut - (Date.now() - this._animationTimeRestarted);
          this._animationTimeRestarted = undefined, this._restartInterval(t);
          return;
        }
        this.isCursorVisible = !this.isCursorVisible, this._animationFrame = this._coreBrowserService.window.requestAnimationFrame(() => {
          this._renderCallback(), this._animationFrame = undefined;
        });
      }, Ut);
    }, e);
  }
  pause() {
    this.isCursorVisible = true, this._blinkInterval && (this._coreBrowserService.window.clearInterval(this._blinkInterval), this._blinkInterval = undefined), this._blinkStartTimeout && (this._coreBrowserService.window.clearTimeout(this._blinkStartTimeout), this._blinkStartTimeout = undefined), this._animationFrame && (this._coreBrowserService.window.cancelAnimationFrame(this._animationFrame), this._animationFrame = undefined);
  }
  resume() {
    this.pause(), this._animationTimeRestarted = undefined, this._restartInterval(), this.restartBlinkAnimation();
  }
};
function Si(i7, e, t) {
  let n = new e.ResizeObserver((s) => {
    let o = s.find((l) => l.target === i7);
    if (!o)
      return;
    if (!("devicePixelContentBoxSize" in o)) {
      n?.disconnect(), n = undefined;
      return;
    }
    let r = o.devicePixelContentBoxSize[0].inlineSize, a = o.devicePixelContentBoxSize[0].blockSize;
    r > 0 && a > 0 && t(r, a);
  });
  try {
    n.observe(i7, { box: ["device-pixel-content-box"] });
  } catch {
    n.disconnect(), n = undefined;
  }
  return O(() => n?.disconnect());
}
function kn(i7) {
  return i7 > 65535 ? (i7 -= 65536, String.fromCharCode((i7 >> 10) + 55296) + String.fromCharCode(i7 % 1024 + 56320)) : String.fromCharCode(i7);
}
var at = class i7 extends he {
  constructor() {
    super(...arguments);
    this.content = 0;
    this.fg = 0;
    this.bg = 0;
    this.extended = new it;
    this.combinedData = "";
  }
  static fromCharData(t) {
    let n = new i7;
    return n.setFromCharData(t), n;
  }
  isCombined() {
    return this.content & 2097152;
  }
  getWidth() {
    return this.content >> 22;
  }
  getChars() {
    return this.content & 2097152 ? this.combinedData : this.content & 2097151 ? kn(this.content & 2097151) : "";
  }
  getCode() {
    return this.isCombined() ? this.combinedData.charCodeAt(this.combinedData.length - 1) : this.content & 2097151;
  }
  setFromCharData(t) {
    this.fg = t[0], this.bg = 0;
    let n = false;
    if (t[1].length > 2)
      n = true;
    else if (t[1].length === 2) {
      let s = t[1].charCodeAt(0);
      if (55296 <= s && s <= 56319) {
        let o = t[1].charCodeAt(1);
        56320 <= o && o <= 57343 ? this.content = (s - 55296) * 1024 + o - 56320 + 65536 | t[2] << 22 : n = true;
      } else
        n = true;
    } else
      this.content = t[1].charCodeAt(0) | t[2] << 22;
    n && (this.combinedData = t[1], this.content = 2097152 | t[2] << 22);
  }
  getAsCharData() {
    return [this.fg, this.getChars(), this.getWidth(), this.getCode()];
  }
};
var Gt = new Float32Array([2, 0, 0, 0, 0, -2, 0, 0, 0, 0, 1, 0, -1, 1, 0, 1]);
function $t(i8, e, t) {
  let n = F(i8.createProgram());
  if (i8.attachShader(n, F(Pn(i8, i8.VERTEX_SHADER, e))), i8.attachShader(n, F(Pn(i8, i8.FRAGMENT_SHADER, t))), i8.linkProgram(n), i8.getProgramParameter(n, i8.LINK_STATUS))
    return n;
  console.error(i8.getProgramInfoLog(n)), i8.deleteProgram(n);
}
function Pn(i8, e, t) {
  let n = F(i8.createShader(e));
  if (i8.shaderSource(n, t), i8.compileShader(n), i8.getShaderParameter(n, i8.COMPILE_STATUS))
    return n;
  console.error(i8.getShaderInfoLog(n)), i8.deleteShader(n);
}
function Bn(i8, e) {
  let t = Math.min(i8.length * 2, e), n = new Float32Array(t);
  for (let s = 0;s < i8.length; s++)
    n[s] = i8[s];
  return n;
}
var Wt = class {
  constructor(e) {
    this.texture = e, this.version = -1;
  }
};
var is = `#version 300 es
layout (location = 0) in vec2 a_unitquad;
layout (location = 1) in vec2 a_cellpos;
layout (location = 2) in vec2 a_offset;
layout (location = 3) in vec2 a_size;
layout (location = 4) in float a_texpage;
layout (location = 5) in vec2 a_texcoord;
layout (location = 6) in vec2 a_texsize;

uniform mat4 u_projection;
uniform vec2 u_resolution;

out vec2 v_texcoord;
flat out int v_texpage;

void main() {
  vec2 zeroToOne = (a_offset / u_resolution) + a_cellpos + (a_unitquad * a_size);
  gl_Position = u_projection * vec4(zeroToOne, 0.0, 1.0);
  v_texpage = int(a_texpage);
  v_texcoord = a_texcoord + a_unitquad * a_texsize;
}`;
function ns(i8) {
  let e = "";
  for (let t = 1;t < i8; t++)
    e += ` else if (v_texpage == ${t}) { outColor = texture(u_texture[${t}], v_texcoord); }`;
  return `#version 300 es
precision lowp float;

in vec2 v_texcoord;
flat in int v_texpage;

uniform sampler2D u_texture[${i8}];

out vec4 outColor;

void main() {
  if (v_texpage == 0) {
    outColor = texture(u_texture[0], v_texcoord);
  } ${e}
}`;
}
var De = 11;
var Ve = De * Float32Array.BYTES_PER_ELEMENT;
var rs = 2;
var H = 0;
var k;
var Fi = 0;
var lt = 0;
var Kt = class extends B {
  constructor(t, n, s, o) {
    super();
    this._terminal = t;
    this._gl = n;
    this._dimensions = s;
    this._optionsService = o;
    this._activeBuffer = 0;
    this._vertices = { count: 0, attributes: new Float32Array(0), attributesBuffers: [new Float32Array(0), new Float32Array(0)] };
    let r = this._gl;
    ae.maxAtlasPages === undefined && (ae.maxAtlasPages = Math.min(32, F(r.getParameter(r.MAX_TEXTURE_IMAGE_UNITS))), ae.maxTextureSize = F(r.getParameter(r.MAX_TEXTURE_SIZE))), this._program = F($t(r, is, ns(ae.maxAtlasPages))), this._register(O(() => r.deleteProgram(this._program))), this._projectionLocation = F(r.getUniformLocation(this._program, "u_projection")), this._resolutionLocation = F(r.getUniformLocation(this._program, "u_resolution")), this._textureLocation = F(r.getUniformLocation(this._program, "u_texture")), this._vertexArrayObject = r.createVertexArray(), r.bindVertexArray(this._vertexArrayObject);
    let a = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), l = r.createBuffer();
    this._register(O(() => r.deleteBuffer(l))), r.bindBuffer(r.ARRAY_BUFFER, l), r.bufferData(r.ARRAY_BUFFER, a, r.STATIC_DRAW), r.enableVertexAttribArray(0), r.vertexAttribPointer(0, 2, this._gl.FLOAT, false, 0, 0);
    let u = new Uint8Array([0, 1, 2, 3]), c = r.createBuffer();
    this._register(O(() => r.deleteBuffer(c))), r.bindBuffer(r.ELEMENT_ARRAY_BUFFER, c), r.bufferData(r.ELEMENT_ARRAY_BUFFER, u, r.STATIC_DRAW), this._attributesBuffer = F(r.createBuffer()), this._register(O(() => r.deleteBuffer(this._attributesBuffer))), r.bindBuffer(r.ARRAY_BUFFER, this._attributesBuffer), r.enableVertexAttribArray(2), r.vertexAttribPointer(2, 2, r.FLOAT, false, Ve, 0), r.vertexAttribDivisor(2, 1), r.enableVertexAttribArray(3), r.vertexAttribPointer(3, 2, r.FLOAT, false, Ve, 2 * Float32Array.BYTES_PER_ELEMENT), r.vertexAttribDivisor(3, 1), r.enableVertexAttribArray(4), r.vertexAttribPointer(4, 1, r.FLOAT, false, Ve, 4 * Float32Array.BYTES_PER_ELEMENT), r.vertexAttribDivisor(4, 1), r.enableVertexAttribArray(5), r.vertexAttribPointer(5, 2, r.FLOAT, false, Ve, 5 * Float32Array.BYTES_PER_ELEMENT), r.vertexAttribDivisor(5, 1), r.enableVertexAttribArray(6), r.vertexAttribPointer(6, 2, r.FLOAT, false, Ve, 7 * Float32Array.BYTES_PER_ELEMENT), r.vertexAttribDivisor(6, 1), r.enableVertexAttribArray(1), r.vertexAttribPointer(1, 2, r.FLOAT, false, Ve, 9 * Float32Array.BYTES_PER_ELEMENT), r.vertexAttribDivisor(1, 1), r.useProgram(this._program);
    let d = new Int32Array(ae.maxAtlasPages);
    for (let h = 0;h < ae.maxAtlasPages; h++)
      d[h] = h;
    r.uniform1iv(this._textureLocation, d), r.uniformMatrix4fv(this._projectionLocation, false, Gt), this._atlasTextures = [];
    for (let h = 0;h < ae.maxAtlasPages; h++) {
      let f = new Wt(F(r.createTexture()));
      this._register(O(() => r.deleteTexture(f.texture))), r.activeTexture(r.TEXTURE0 + h), r.bindTexture(r.TEXTURE_2D, f.texture), r.texParameteri(r.TEXTURE_2D, r.TEXTURE_WRAP_S, r.CLAMP_TO_EDGE), r.texParameteri(r.TEXTURE_2D, r.TEXTURE_WRAP_T, r.CLAMP_TO_EDGE), r.texImage2D(r.TEXTURE_2D, 0, r.RGBA, 1, 1, 0, r.RGBA, r.UNSIGNED_BYTE, new Uint8Array([255, 0, 0, 255])), this._atlasTextures[h] = f;
    }
    r.enable(r.BLEND), r.blendFunc(r.SRC_ALPHA, r.ONE_MINUS_SRC_ALPHA), this.handleResize();
  }
  beginFrame() {
    return this._atlas ? this._atlas.beginFrame() : true;
  }
  updateCell(t, n, s, o, r, a, l, u, c) {
    this._updateCell(this._vertices.attributes, t, n, s, o, r, a, l, u, c);
  }
  _updateCell(t, n, s, o, r, a, l, u, c, d) {
    if (H = (s * this._terminal.cols + n) * De, o === 0 || o === undefined) {
      t.fill(0, H, H + De - 1 - rs);
      return;
    }
    this._atlas && (u && u.length > 1 ? k = this._atlas.getRasterizedGlyphCombinedChar(u, r, a, l, false, this._terminal.element) : k = this._atlas.getRasterizedGlyph(o, r, a, l, false, this._terminal.element), Fi = Math.floor((this._dimensions.device.cell.width - this._dimensions.device.char.width) / 2), r !== d && k.offset.x > Fi ? (lt = k.offset.x - Fi, t[H] = -(k.offset.x - lt) + this._dimensions.device.char.left, t[H + 1] = -k.offset.y + this._dimensions.device.char.top, t[H + 2] = (k.size.x - lt) / this._dimensions.device.canvas.width, t[H + 3] = k.size.y / this._dimensions.device.canvas.height, t[H + 4] = k.texturePage, t[H + 5] = k.texturePositionClipSpace.x + lt / this._atlas.pages[k.texturePage].canvas.width, t[H + 6] = k.texturePositionClipSpace.y, t[H + 7] = k.sizeClipSpace.x - lt / this._atlas.pages[k.texturePage].canvas.width, t[H + 8] = k.sizeClipSpace.y) : (t[H] = -k.offset.x + this._dimensions.device.char.left, t[H + 1] = -k.offset.y + this._dimensions.device.char.top, t[H + 2] = k.size.x / this._dimensions.device.canvas.width, t[H + 3] = k.size.y / this._dimensions.device.canvas.height, t[H + 4] = k.texturePage, t[H + 5] = k.texturePositionClipSpace.x, t[H + 6] = k.texturePositionClipSpace.y, t[H + 7] = k.sizeClipSpace.x, t[H + 8] = k.sizeClipSpace.y), this._optionsService.rawOptions.rescaleOverlappingGlyphs && mn(o, c, k.size.x, this._dimensions.device.cell.width) && (t[H + 2] = (this._dimensions.device.cell.width - 1) / this._dimensions.device.canvas.width));
  }
  clear() {
    let t = this._terminal, n = t.cols * t.rows * De;
    this._vertices.count !== n ? this._vertices.attributes = new Float32Array(n) : this._vertices.attributes.fill(0);
    let s = 0;
    for (;s < this._vertices.attributesBuffers.length; s++)
      this._vertices.count !== n ? this._vertices.attributesBuffers[s] = new Float32Array(n) : this._vertices.attributesBuffers[s].fill(0);
    this._vertices.count = n, s = 0;
    for (let o = 0;o < t.rows; o++)
      for (let r = 0;r < t.cols; r++)
        this._vertices.attributes[s + 9] = r / t.cols, this._vertices.attributes[s + 10] = o / t.rows, s += De;
  }
  handleResize() {
    let t = this._gl;
    t.useProgram(this._program), t.viewport(0, 0, t.canvas.width, t.canvas.height), t.uniform2f(this._resolutionLocation, t.canvas.width, t.canvas.height), this.clear();
  }
  render(t) {
    if (!this._atlas)
      return;
    let n = this._gl;
    n.useProgram(this._program), n.bindVertexArray(this._vertexArrayObject), this._activeBuffer = (this._activeBuffer + 1) % 2;
    let s = this._vertices.attributesBuffers[this._activeBuffer], o = 0;
    for (let r = 0;r < t.lineLengths.length; r++) {
      let a = r * this._terminal.cols * De, l = this._vertices.attributes.subarray(a, a + t.lineLengths[r] * De);
      s.set(l, o), o += l.length;
    }
    n.bindBuffer(n.ARRAY_BUFFER, this._attributesBuffer), n.bufferData(n.ARRAY_BUFFER, s.subarray(0, o), n.STREAM_DRAW);
    for (let r = 0;r < this._atlas.pages.length; r++)
      this._atlas.pages[r].version !== this._atlasTextures[r].version && this._bindAtlasPageTexture(n, this._atlas, r);
    n.drawElementsInstanced(n.TRIANGLE_STRIP, 4, n.UNSIGNED_BYTE, 0, o / De);
  }
  setAtlas(t) {
    this._atlas = t;
    for (let n of this._atlasTextures)
      n.version = -1;
  }
  _bindAtlasPageTexture(t, n, s) {
    t.activeTexture(t.TEXTURE0 + s), t.bindTexture(t.TEXTURE_2D, this._atlasTextures[s].texture), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_WRAP_S, t.CLAMP_TO_EDGE), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_WRAP_T, t.CLAMP_TO_EDGE), t.texImage2D(t.TEXTURE_2D, 0, t.RGBA, t.RGBA, t.UNSIGNED_BYTE, n.pages[s].canvas), t.generateMipmap(t.TEXTURE_2D), this._atlasTextures[s].version = n.pages[s].version;
  }
  setDimensions(t) {
    this._dimensions = t;
  }
};
var ki = class {
  constructor() {
    this.clear();
  }
  clear() {
    this.hasSelection = false, this.columnSelectMode = false, this.viewportStartRow = 0, this.viewportEndRow = 0, this.viewportCappedStartRow = 0, this.viewportCappedEndRow = 0, this.startCol = 0, this.endCol = 0, this.selectionStart = undefined, this.selectionEnd = undefined;
  }
  update(e, t, n, s = false) {
    if (this.selectionStart = t, this.selectionEnd = n, !t || !n || t[0] === n[0] && t[1] === n[1]) {
      this.clear();
      return;
    }
    let o = e.buffers.active.ydisp, r = t[1] - o, a = n[1] - o, l = Math.max(r, 0), u = Math.min(a, e.rows - 1);
    if (l >= e.rows || u < 0) {
      this.clear();
      return;
    }
    this.hasSelection = true, this.columnSelectMode = s, this.viewportStartRow = r, this.viewportEndRow = a, this.viewportCappedStartRow = l, this.viewportCappedEndRow = u, this.startCol = t[0], this.endCol = n[0];
  }
  isCellSelected(e, t, n) {
    return this.hasSelection ? (n -= e.buffer.active.viewportY, this.columnSelectMode ? this.startCol <= this.endCol ? t >= this.startCol && n >= this.viewportCappedStartRow && t < this.endCol && n <= this.viewportCappedEndRow : t < this.startCol && n >= this.viewportCappedStartRow && t >= this.endCol && n <= this.viewportCappedEndRow : n > this.viewportStartRow && n < this.viewportEndRow || this.viewportStartRow === this.viewportEndRow && n === this.viewportStartRow && t >= this.startCol && t < this.endCol || this.viewportStartRow < this.viewportEndRow && n === this.viewportEndRow && t < this.endCol || this.viewportStartRow < this.viewportEndRow && n === this.viewportStartRow && t >= this.startCol) : false;
  }
};
function Nn() {
  return new ki;
}
var Ce = 4;
var ze = 1;
var qe = 2;
var Ct = 3;
var Un = 2147483648;
var Vt = class {
  constructor() {
    this.cells = new Uint32Array(0), this.lineLengths = new Uint32Array(0), this.selection = Nn();
  }
  resize(e, t) {
    let n = e * t * Ce;
    n !== this.cells.length && (this.cells = new Uint32Array(n), this.lineLengths = new Uint32Array(t));
  }
  clear() {
    this.cells.fill(0, 0), this.lineLengths.fill(0, 0);
  }
};
var ss = `#version 300 es
layout (location = 0) in vec2 a_position;
layout (location = 1) in vec2 a_size;
layout (location = 2) in vec4 a_color;
layout (location = 3) in vec2 a_unitquad;

uniform mat4 u_projection;

out vec4 v_color;

void main() {
  vec2 zeroToOne = a_position + (a_unitquad * a_size);
  gl_Position = u_projection * vec4(zeroToOne, 0.0, 1.0);
  v_color = a_color;
}`;
var os = `#version 300 es
precision lowp float;

in vec4 v_color;

out vec4 outColor;

void main() {
  outColor = v_color;
}`;
var Ee = 8;
var Pi = Ee * Float32Array.BYTES_PER_ELEMENT;
var as = 20 * Ee;
var zt = class {
  constructor() {
    this.attributes = new Float32Array(as), this.count = 0;
  }
};
var xe = 0;
var Hn = 0;
var Wn = 0;
var Gn = 0;
var $n = 0;
var Kn = 0;
var Vn = 0;
var qt = class extends B {
  constructor(t, n, s, o) {
    super();
    this._terminal = t;
    this._gl = n;
    this._dimensions = s;
    this._themeService = o;
    this._vertices = new zt;
    this._verticesCursor = new zt;
    let r = this._gl;
    this._program = F($t(r, ss, os)), this._register(O(() => r.deleteProgram(this._program))), this._projectionLocation = F(r.getUniformLocation(this._program, "u_projection")), this._vertexArrayObject = r.createVertexArray(), r.bindVertexArray(this._vertexArrayObject);
    let a = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), l = r.createBuffer();
    this._register(O(() => r.deleteBuffer(l))), r.bindBuffer(r.ARRAY_BUFFER, l), r.bufferData(r.ARRAY_BUFFER, a, r.STATIC_DRAW), r.enableVertexAttribArray(3), r.vertexAttribPointer(3, 2, this._gl.FLOAT, false, 0, 0);
    let u = new Uint8Array([0, 1, 2, 3]), c = r.createBuffer();
    this._register(O(() => r.deleteBuffer(c))), r.bindBuffer(r.ELEMENT_ARRAY_BUFFER, c), r.bufferData(r.ELEMENT_ARRAY_BUFFER, u, r.STATIC_DRAW), this._attributesBuffer = F(r.createBuffer()), this._register(O(() => r.deleteBuffer(this._attributesBuffer))), r.bindBuffer(r.ARRAY_BUFFER, this._attributesBuffer), r.enableVertexAttribArray(0), r.vertexAttribPointer(0, 2, r.FLOAT, false, Pi, 0), r.vertexAttribDivisor(0, 1), r.enableVertexAttribArray(1), r.vertexAttribPointer(1, 2, r.FLOAT, false, Pi, 2 * Float32Array.BYTES_PER_ELEMENT), r.vertexAttribDivisor(1, 1), r.enableVertexAttribArray(2), r.vertexAttribPointer(2, 4, r.FLOAT, false, Pi, 4 * Float32Array.BYTES_PER_ELEMENT), r.vertexAttribDivisor(2, 1), this._updateCachedColors(o.colors), this._register(this._themeService.onChangeColors((d) => {
      this._updateCachedColors(d), this._updateViewportRectangle();
    }));
  }
  renderBackgrounds() {
    this._renderVertices(this._vertices);
  }
  renderCursor() {
    this._renderVertices(this._verticesCursor);
  }
  _renderVertices(t) {
    let n = this._gl;
    n.useProgram(this._program), n.bindVertexArray(this._vertexArrayObject), n.uniformMatrix4fv(this._projectionLocation, false, Gt), n.bindBuffer(n.ARRAY_BUFFER, this._attributesBuffer), n.bufferData(n.ARRAY_BUFFER, t.attributes, n.DYNAMIC_DRAW), n.drawElementsInstanced(this._gl.TRIANGLE_STRIP, 4, n.UNSIGNED_BYTE, 0, t.count);
  }
  handleResize() {
    this._updateViewportRectangle();
  }
  setDimensions(t) {
    this._dimensions = t;
  }
  _updateCachedColors(t) {
    this._bgFloat = this._colorToFloat32Array(t.background), this._cursorFloat = this._colorToFloat32Array(t.cursor);
  }
  _updateViewportRectangle() {
    this._addRectangleFloat(this._vertices.attributes, 0, 0, 0, this._terminal.cols * this._dimensions.device.cell.width, this._terminal.rows * this._dimensions.device.cell.height, this._bgFloat);
  }
  updateBackgrounds(t) {
    let n = this._terminal, s = this._vertices, o = 1, r, a, l, u, c, d, h, f, I, L, M;
    for (r = 0;r < n.rows; r++) {
      for (l = -1, u = 0, c = 0, d = false, a = 0;a < n.cols; a++)
        h = (r * n.cols + a) * Ce, f = t.cells[h + ze], I = t.cells[h + qe], L = !!(I & 67108864), (f !== u || I !== c && (d || L)) && ((u !== 0 || d && c !== 0) && (M = o++ * Ee, this._updateRectangle(s, M, c, u, l, a, r)), l = a, u = f, c = I, d = L);
      (u !== 0 || d && c !== 0) && (M = o++ * Ee, this._updateRectangle(s, M, c, u, l, n.cols, r));
    }
    s.count = o;
  }
  updateCursor(t) {
    let n = this._verticesCursor, s = t.cursor;
    if (!s || s.style === "block") {
      n.count = 0;
      return;
    }
    let o, r = 0;
    (s.style === "bar" || s.style === "outline") && (o = r++ * Ee, this._addRectangleFloat(n.attributes, o, s.x * this._dimensions.device.cell.width, s.y * this._dimensions.device.cell.height, s.style === "bar" ? s.dpr * s.cursorWidth : s.dpr, this._dimensions.device.cell.height, this._cursorFloat)), (s.style === "underline" || s.style === "outline") && (o = r++ * Ee, this._addRectangleFloat(n.attributes, o, s.x * this._dimensions.device.cell.width, (s.y + 1) * this._dimensions.device.cell.height - s.dpr, s.width * this._dimensions.device.cell.width, s.dpr, this._cursorFloat)), s.style === "outline" && (o = r++ * Ee, this._addRectangleFloat(n.attributes, o, s.x * this._dimensions.device.cell.width, s.y * this._dimensions.device.cell.height, s.width * this._dimensions.device.cell.width, s.dpr, this._cursorFloat), o = r++ * Ee, this._addRectangleFloat(n.attributes, o, (s.x + s.width) * this._dimensions.device.cell.width - s.dpr, s.y * this._dimensions.device.cell.height, s.dpr, this._dimensions.device.cell.height, this._cursorFloat)), n.count = r;
  }
  _updateRectangle(t, n, s, o, r, a, l) {
    if (s & 67108864)
      switch (s & 50331648) {
        case 16777216:
        case 33554432:
          xe = this._themeService.colors.ansi[s & 255].rgba;
          break;
        case 50331648:
          xe = (s & 16777215) << 8;
          break;
        case 0:
        default:
          xe = this._themeService.colors.foreground.rgba;
      }
    else
      switch (o & 50331648) {
        case 16777216:
        case 33554432:
          xe = this._themeService.colors.ansi[o & 255].rgba;
          break;
        case 50331648:
          xe = (o & 16777215) << 8;
          break;
        case 0:
        default:
          xe = this._themeService.colors.background.rgba;
      }
    t.attributes.length < n + 4 && (t.attributes = Bn(t.attributes, this._terminal.rows * this._terminal.cols * Ee)), Hn = r * this._dimensions.device.cell.width, Wn = l * this._dimensions.device.cell.height, Gn = (xe >> 24 & 255) / 255, $n = (xe >> 16 & 255) / 255, Kn = (xe >> 8 & 255) / 255, Vn = 1, this._addRectangle(t.attributes, n, Hn, Wn, (a - r) * this._dimensions.device.cell.width, this._dimensions.device.cell.height, Gn, $n, Kn, Vn);
  }
  _addRectangle(t, n, s, o, r, a, l, u, c, d) {
    t[n] = s / this._dimensions.device.canvas.width, t[n + 1] = o / this._dimensions.device.canvas.height, t[n + 2] = r / this._dimensions.device.canvas.width, t[n + 3] = a / this._dimensions.device.canvas.height, t[n + 4] = l, t[n + 5] = u, t[n + 6] = c, t[n + 7] = d;
  }
  _addRectangleFloat(t, n, s, o, r, a, l) {
    t[n] = s / this._dimensions.device.canvas.width, t[n + 1] = o / this._dimensions.device.canvas.height, t[n + 2] = r / this._dimensions.device.canvas.width, t[n + 3] = a / this._dimensions.device.canvas.height, t[n + 4] = l[0], t[n + 5] = l[1], t[n + 6] = l[2], t[n + 7] = l[3];
  }
  _colorToFloat32Array(t) {
    return new Float32Array([(t.rgba >> 24 & 255) / 255, (t.rgba >> 16 & 255) / 255, (t.rgba >> 8 & 255) / 255, (t.rgba & 255) / 255]);
  }
};
var jt = class extends B {
  constructor(t, n, s, o, r, a, l, u) {
    super();
    this._container = n;
    this._alpha = r;
    this._coreBrowserService = a;
    this._optionsService = l;
    this._themeService = u;
    this._deviceCharWidth = 0;
    this._deviceCharHeight = 0;
    this._deviceCellWidth = 0;
    this._deviceCellHeight = 0;
    this._deviceCharLeft = 0;
    this._deviceCharTop = 0;
    this._canvas = this._coreBrowserService.mainDocument.createElement("canvas"), this._canvas.classList.add(`xterm-${s}-layer`), this._canvas.style.zIndex = o.toString(), this._initCanvas(), this._container.appendChild(this._canvas), this._register(this._themeService.onChangeColors((c) => {
      this._refreshCharAtlas(t, c), this.reset(t);
    })), this._register(O(() => {
      this._canvas.remove();
    }));
  }
  _initCanvas() {
    this._ctx = F(this._canvas.getContext("2d", { alpha: this._alpha })), this._alpha || this._clearAll();
  }
  handleBlur(t) {}
  handleFocus(t) {}
  handleCursorMove(t) {}
  handleGridChanged(t, n, s) {}
  handleSelectionChanged(t, n, s, o = false) {}
  _setTransparency(t, n) {
    if (n === this._alpha)
      return;
    let s = this._canvas;
    this._alpha = n, this._canvas = this._canvas.cloneNode(), this._initCanvas(), this._container.replaceChild(this._canvas, s), this._refreshCharAtlas(t, this._themeService.colors), this.handleGridChanged(t, 0, t.rows - 1);
  }
  _refreshCharAtlas(t, n) {
    this._deviceCharWidth <= 0 && this._deviceCharHeight <= 0 || (this._charAtlas = Nt(t, this._optionsService.rawOptions, n, this._deviceCellWidth, this._deviceCellHeight, this._deviceCharWidth, this._deviceCharHeight, this._coreBrowserService.dpr, 2048), this._charAtlas.warmUp());
  }
  resize(t, n) {
    this._deviceCellWidth = n.device.cell.width, this._deviceCellHeight = n.device.cell.height, this._deviceCharWidth = n.device.char.width, this._deviceCharHeight = n.device.char.height, this._deviceCharLeft = n.device.char.left, this._deviceCharTop = n.device.char.top, this._canvas.width = n.device.canvas.width, this._canvas.height = n.device.canvas.height, this._canvas.style.width = `${n.css.canvas.width}px`, this._canvas.style.height = `${n.css.canvas.height}px`, this._alpha || this._clearAll(), this._refreshCharAtlas(t, this._themeService.colors);
  }
  _fillBottomLineAtCells(t, n, s = 1) {
    this._ctx.fillRect(t * this._deviceCellWidth, (n + 1) * this._deviceCellHeight - this._coreBrowserService.dpr - 1, s * this._deviceCellWidth, this._coreBrowserService.dpr);
  }
  _clearAll() {
    this._alpha ? this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height) : (this._ctx.fillStyle = this._themeService.colors.background.css, this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height));
  }
  _clearCells(t, n, s, o) {
    this._alpha ? this._ctx.clearRect(t * this._deviceCellWidth, n * this._deviceCellHeight, s * this._deviceCellWidth, o * this._deviceCellHeight) : (this._ctx.fillStyle = this._themeService.colors.background.css, this._ctx.fillRect(t * this._deviceCellWidth, n * this._deviceCellHeight, s * this._deviceCellWidth, o * this._deviceCellHeight));
  }
  _fillCharTrueColor(t, n, s, o) {
    this._ctx.font = this._getFont(t, false, false), this._ctx.textBaseline = St, this._clipCell(s, o, n.getWidth()), this._ctx.fillText(n.getChars(), s * this._deviceCellWidth + this._deviceCharLeft, o * this._deviceCellHeight + this._deviceCharTop + this._deviceCharHeight);
  }
  _clipCell(t, n, s) {
    this._ctx.beginPath(), this._ctx.rect(t * this._deviceCellWidth, n * this._deviceCellHeight, s * this._deviceCellWidth, this._deviceCellHeight), this._ctx.clip();
  }
  _getFont(t, n, s) {
    let o = n ? t.options.fontWeightBold : t.options.fontWeight;
    return `${s ? "italic" : ""} ${o} ${t.options.fontSize * this._coreBrowserService.dpr}px ${t.options.fontFamily}`;
  }
};
var Xt = class extends jt {
  constructor(e, t, n, s, o, r, a) {
    super(n, e, "link", t, true, o, r, a), this._register(s.onShowLinkUnderline((l) => this._handleShowLinkUnderline(l))), this._register(s.onHideLinkUnderline((l) => this._handleHideLinkUnderline(l)));
  }
  resize(e, t) {
    super.resize(e, t), this._state = undefined;
  }
  reset(e) {
    this._clearCurrentLink();
  }
  _clearCurrentLink() {
    if (this._state) {
      this._clearCells(this._state.x1, this._state.y1, this._state.cols - this._state.x1, 1);
      let e = this._state.y2 - this._state.y1 - 1;
      e > 0 && this._clearCells(0, this._state.y1 + 1, this._state.cols, e), this._clearCells(0, this._state.y2, this._state.x2, 1), this._state = undefined;
    }
  }
  _handleShowLinkUnderline(e) {
    if (e.fg === 257 ? this._ctx.fillStyle = this._themeService.colors.background.css : e.fg !== undefined && Fn(e.fg) ? this._ctx.fillStyle = this._themeService.colors.ansi[e.fg].css : this._ctx.fillStyle = this._themeService.colors.foreground.css, e.y1 === e.y2)
      this._fillBottomLineAtCells(e.x1, e.y1, e.x2 - e.x1);
    else {
      this._fillBottomLineAtCells(e.x1, e.y1, e.cols - e.x1);
      for (let t = e.y1 + 1;t < e.y2; t++)
        this._fillBottomLineAtCells(0, t, e.cols);
      this._fillBottomLineAtCells(0, e.y2, e.x2);
    }
    this._state = e;
  }
  _handleHideLinkUnderline(e) {
    this._clearCurrentLink();
  }
};
var te = typeof window == "object" ? window : globalThis;
var Zt = class Zt2 {
  constructor() {
    this.mapWindowIdToZoomLevel = new Map;
    this._onDidChangeZoomLevel = new D;
    this.onDidChangeZoomLevel = this._onDidChangeZoomLevel.event;
    this.mapWindowIdToZoomFactor = new Map;
    this._onDidChangeFullscreen = new D;
    this.onDidChangeFullscreen = this._onDidChangeFullscreen.event;
    this.mapWindowIdToFullScreen = new Map;
  }
  getZoomLevel(e) {
    return this.mapWindowIdToZoomLevel.get(this.getWindowId(e)) ?? 0;
  }
  setZoomLevel(e, t) {
    if (this.getZoomLevel(t) === e)
      return;
    let n = this.getWindowId(t);
    this.mapWindowIdToZoomLevel.set(n, e), this._onDidChangeZoomLevel.fire(n);
  }
  getZoomFactor(e) {
    return this.mapWindowIdToZoomFactor.get(this.getWindowId(e)) ?? 1;
  }
  setZoomFactor(e, t) {
    this.mapWindowIdToZoomFactor.set(this.getWindowId(t), e);
  }
  setFullscreen(e, t) {
    if (this.isFullscreen(t) === e)
      return;
    let n = this.getWindowId(t);
    this.mapWindowIdToFullScreen.set(n, e), this._onDidChangeFullscreen.fire(n);
  }
  isFullscreen(e) {
    return !!this.mapWindowIdToFullScreen.get(this.getWindowId(e));
  }
  getWindowId(e) {
    return e.vscodeWindowId;
  }
};
Zt.INSTANCE = new Zt;
var Qt = Zt;
function us(i8, e, t) {
  typeof e == "string" && (e = i8.matchMedia(e)), e.addEventListener("change", t);
}
var Wa = Qt.INSTANCE.onDidChangeZoomLevel;
var Ga = Qt.INSTANCE.onDidChangeFullscreen;
var je = typeof navigator == "object" ? navigator.userAgent : "";
var Cn = je.indexOf("Firefox") >= 0;
var ut = je.indexOf("AppleWebKit") >= 0;
var zn = je.indexOf("Chrome") >= 0;
var Bi = !zn && je.indexOf("Safari") >= 0;
var $a = je.indexOf("Electron/") >= 0;
var Ka = je.indexOf("Android") >= 0;
var Yt = false;
if (typeof te.matchMedia == "function") {
  let i8 = te.matchMedia("(display-mode: standalone) or (display-mode: window-controls-overlay)"), e = te.matchMedia("(display-mode: fullscreen)");
  Yt = i8.matches, us(te, i8, ({ matches: t }) => {
    Yt && e.matches || (Yt = t);
  });
}
function qn() {
  return Yt;
}
var Xe = "en";
var Ui = false;
var ni = false;
var ti = false;
var cs = false;
var Xn = false;
var Yn = false;
var ds = false;
var hs = false;
var ps = false;
var fs = false;
var ei;
var ii = Xe;
var jn = Xe;
var ms;
var ye;
var Ie = globalThis;
var re;
typeof Ie.vscode < "u" && typeof Ie.vscode.process < "u" ? re = Ie.vscode.process : typeof process < "u" && typeof process?.versions?.node == "string" && (re = process);
var Qn = typeof re?.versions?.electron == "string";
var _s = Qn && re?.type === "renderer";
if (typeof re == "object") {
  Ui = re.platform === "win32", ni = re.platform === "darwin", ti = re.platform === "linux", cs = ti && !!re.env.SNAP && !!re.env.SNAP_REVISION, ds = Qn, ps = !!re.env.CI || !!re.env.BUILD_ARTIFACTSTAGINGDIRECTORY, ei = Xe, ii = Xe;
  let i8 = re.env.VSCODE_NLS_CONFIG;
  if (i8)
    try {
      let e = JSON.parse(i8);
      ei = e.userLocale, jn = e.osLocale, ii = e.resolvedLanguage || Xe, ms = e.languagePack?.translationsConfigFile;
    } catch {}
  Xn = true;
} else
  typeof navigator == "object" && !_s ? (ye = navigator.userAgent, Ui = ye.indexOf("Windows") >= 0, ni = ye.indexOf("Macintosh") >= 0, hs = (ye.indexOf("Macintosh") >= 0 || ye.indexOf("iPad") >= 0 || ye.indexOf("iPhone") >= 0) && !!navigator.maxTouchPoints && navigator.maxTouchPoints > 0, ti = ye.indexOf("Linux") >= 0, fs = ye?.indexOf("Mobi") >= 0, Yn = true, ii = globalThis._VSCODE_NLS_LANGUAGE || Xe, ei = navigator.language.toLowerCase(), jn = ei) : console.error("Unable to resolve platform.");
var Ni = 0;
ni ? Ni = 1 : Ui ? Ni = 3 : ti && (Ni = 2);
var ri = Xn;
var bs = Yn && typeof Ie.importScripts == "function";
var Va = bs ? Ie.origin : undefined;
var _e = ye;
var Me = ii;
var vs;
((n) => {
  function i8() {
    return Me;
  }
  n.value = i8;
  function e() {
    return Me.length === 2 ? Me === "en" : Me.length >= 3 ? Me[0] === "e" && Me[1] === "n" && Me[2] === "-" : false;
  }
  n.isDefaultVariant = e;
  function t() {
    return Me === "en";
  }
  n.isDefault = t;
})(vs ||= {});
var Ts = typeof Ie.postMessage == "function" && !Ie.importScripts;
var Zn = (() => {
  if (Ts) {
    let i8 = [];
    Ie.addEventListener("message", (t) => {
      if (t.data && t.data.vscodeScheduleAsyncWork)
        for (let n = 0, s = i8.length;n < s; n++) {
          let o = i8[n];
          if (o.id === t.data.vscodeScheduleAsyncWork) {
            i8.splice(n, 1), o.callback();
            return;
          }
        }
    });
    let e = 0;
    return (t) => {
      let n = ++e;
      i8.push({ id: n, callback: t }), Ie.postMessage({ vscodeScheduleAsyncWork: n }, "*");
    };
  }
  return (i8) => setTimeout(i8);
})();
var gs = !!(_e && _e.indexOf("Chrome") >= 0);
var Ca = !!(_e && _e.indexOf("Firefox") >= 0);
var za = !!(!gs && _e && _e.indexOf("Safari") >= 0);
var qa = !!(_e && _e.indexOf("Edg/") >= 0);
var ja = !!(_e && _e.indexOf("Android") >= 0);
var Ae = typeof navigator == "object" ? navigator : {};
var xs = { clipboard: { writeText: ri || document.queryCommandSupported && document.queryCommandSupported("copy") || !!(Ae && Ae.clipboard && Ae.clipboard.writeText), readText: ri || !!(Ae && Ae.clipboard && Ae.clipboard.readText) }, keyboard: ri || qn() ? 0 : Ae.keyboard || Bi ? 1 : 2, touch: "ontouchstart" in te || Ae.maxTouchPoints > 0, pointerEvents: te.PointerEvent && (("ontouchstart" in te) || navigator.maxTouchPoints > 0) };
var dt = class {
  constructor() {
    this._keyCodeToStr = [], this._strToKeyCode = Object.create(null);
  }
  define(e, t) {
    this._keyCodeToStr[e] = t, this._strToKeyCode[t.toLowerCase()] = e;
  }
  keyCodeToStr(e) {
    return this._keyCodeToStr[e];
  }
  strToKeyCode(e) {
    return this._strToKeyCode[e.toLowerCase()] || 0;
  }
};
var Hi = new dt;
var Jn = new dt;
var er = new dt;
var Es = new Array(230);
var tr;
((r) => {
  function i8(a) {
    return Hi.keyCodeToStr(a);
  }
  r.toString = i8;
  function e(a) {
    return Hi.strToKeyCode(a);
  }
  r.fromString = e;
  function t(a) {
    return Jn.keyCodeToStr(a);
  }
  r.toUserSettingsUS = t;
  function n(a) {
    return er.keyCodeToStr(a);
  }
  r.toUserSettingsGeneral = n;
  function s(a) {
    return Jn.strToKeyCode(a) || er.strToKeyCode(a);
  }
  r.fromUserSettings = s;
  function o(a) {
    if (a >= 98 && a <= 113)
      return null;
    switch (a) {
      case 16:
        return "Up";
      case 18:
        return "Down";
      case 15:
        return "Left";
      case 17:
        return "Right";
    }
    return Hi.keyCodeToStr(a);
  }
  r.toElectronAccelerator = o;
})(tr ||= {});
var nr = Object.freeze(function(i8, e) {
  let t = setTimeout(i8.bind(e), 0);
  return { dispose() {
    clearTimeout(t);
  } };
});
var Is;
((n) => {
  function i8(s) {
    return s === n.None || s === n.Cancelled || s instanceof Wi ? true : !s || typeof s != "object" ? false : typeof s.isCancellationRequested == "boolean" && typeof s.onCancellationRequested == "function";
  }
  n.isCancellationToken = i8, n.None = Object.freeze({ isCancellationRequested: false, onCancellationRequested: ee.None }), n.Cancelled = Object.freeze({ isCancellationRequested: true, onCancellationRequested: nr });
})(Is ||= {});
var Wi = class {
  constructor() {
    this._isCancelled = false;
    this._emitter = null;
  }
  cancel() {
    this._isCancelled || (this._isCancelled = true, this._emitter && (this._emitter.fire(undefined), this.dispose()));
  }
  get isCancellationRequested() {
    return this._isCancelled;
  }
  get onCancellationRequested() {
    return this._isCancelled ? nr : (this._emitter || (this._emitter = new D), this._emitter.event);
  }
  dispose() {
    this._emitter && (this._emitter.dispose(), this._emitter = null);
  }
};
var Ls = Symbol("MicrotaskDelay");
var ws;
var oi;
(function() {
  typeof globalThis.requestIdleCallback != "function" || typeof globalThis.cancelIdleCallback != "function" ? oi = (i8, e) => {
    Zn(() => {
      if (t)
        return;
      let n = Date.now() + 15;
      e(Object.freeze({ didTimeout: true, timeRemaining() {
        return Math.max(0, n - Date.now());
      } }));
    });
    let t = false;
    return { dispose() {
      t || (t = true);
    } };
  } : oi = (i8, e, t) => {
    let n = i8.requestIdleCallback(e, typeof t == "number" ? { timeout: t } : undefined), s = false;
    return { dispose() {
      s || (s = true, i8.cancelIdleCallback(n));
    } };
  }, ws = (i8) => oi(globalThis, i8);
})();
var Rs;
((t) => {
  async function i8(n) {
    let s, o = await Promise.all(n.map((r) => r.then((a) => a, (a) => {
      s || (s = a);
    })));
    if (typeof s < "u")
      throw s;
    return o;
  }
  t.settled = i8;
  function e(n) {
    return new Promise(async (s, o) => {
      try {
        await n(s, o);
      } catch (r) {
        o(r);
      }
    });
  }
  t.withAsyncBody = e;
})(Rs ||= {});
var Q = class Q2 {
  static fromArray(e) {
    return new Q2((t) => {
      t.emitMany(e);
    });
  }
  static fromPromise(e) {
    return new Q2(async (t) => {
      t.emitMany(await e);
    });
  }
  static fromPromises(e) {
    return new Q2(async (t) => {
      await Promise.all(e.map(async (n) => t.emitOne(await n)));
    });
  }
  static merge(e) {
    return new Q2(async (t) => {
      await Promise.all(e.map(async (n) => {
        for await (let s of n)
          t.emitOne(s);
      }));
    });
  }
  constructor(e, t) {
    this._state = 0, this._results = [], this._error = null, this._onReturn = t, this._onStateChanged = new D, queueMicrotask(async () => {
      let n = { emitOne: (s) => this.emitOne(s), emitMany: (s) => this.emitMany(s), reject: (s) => this.reject(s) };
      try {
        await Promise.resolve(e(n)), this.resolve();
      } catch (s) {
        this.reject(s);
      } finally {
        n.emitOne = undefined, n.emitMany = undefined, n.reject = undefined;
      }
    });
  }
  [Symbol.asyncIterator]() {
    let e = 0;
    return { next: async () => {
      do {
        if (this._state === 2)
          throw this._error;
        if (e < this._results.length)
          return { done: false, value: this._results[e++] };
        if (this._state === 1)
          return { done: true, value: undefined };
        await ee.toPromise(this._onStateChanged.event);
      } while (true);
    }, return: async () => (this._onReturn?.(), { done: true, value: undefined }) };
  }
  static map(e, t) {
    return new Q2(async (n) => {
      for await (let s of e)
        n.emitOne(t(s));
    });
  }
  map(e) {
    return Q2.map(this, e);
  }
  static filter(e, t) {
    return new Q2(async (n) => {
      for await (let s of e)
        t(s) && n.emitOne(s);
    });
  }
  filter(e) {
    return Q2.filter(this, e);
  }
  static coalesce(e) {
    return Q2.filter(e, (t) => !!t);
  }
  coalesce() {
    return Q2.coalesce(this);
  }
  static async toPromise(e) {
    let t = [];
    for await (let n of e)
      t.push(n);
    return t;
  }
  toPromise() {
    return Q2.toPromise(this);
  }
  emitOne(e) {
    this._state === 0 && (this._results.push(e), this._onStateChanged.fire());
  }
  emitMany(e) {
    this._state === 0 && (this._results = this._results.concat(e), this._onStateChanged.fire());
  }
  resolve() {
    this._state === 0 && (this._state = 1, this._onStateChanged.fire());
  }
  reject(e) {
    this._state === 0 && (this._state = 2, this._error = e, this._onStateChanged.fire());
  }
};
Q.EMPTY = Q.fromArray([]);
function sr(i8) {
  return 55296 <= i8 && i8 <= 56319;
}
function Gi(i8) {
  return 56320 <= i8 && i8 <= 57343;
}
function or(i8, e) {
  return (i8 - 55296 << 10) + (e - 56320) + 65536;
}
function ur(i8) {
  return Ki(i8, 0);
}
function Ki(i8, e) {
  switch (typeof i8) {
    case "object":
      return i8 === null ? Le(349, e) : Array.isArray(i8) ? As(i8, e) : Ss(i8, e);
    case "string":
      return cr(i8, e);
    case "boolean":
      return Ms(i8, e);
    case "number":
      return Le(i8, e);
    case "undefined":
      return Le(937, e);
    default:
      return Le(617, e);
  }
}
function Le(i8, e) {
  return (e << 5) - e + i8 | 0;
}
function Ms(i8, e) {
  return Le(i8 ? 433 : 863, e);
}
function cr(i8, e) {
  e = Le(149417, e);
  for (let t = 0, n = i8.length;t < n; t++)
    e = Le(i8.charCodeAt(t), e);
  return e;
}
function As(i8, e) {
  return e = Le(104579, e), i8.reduce((t, n) => Ki(n, t), e);
}
function Ss(i8, e) {
  return e = Le(181387, e), Object.keys(i8).sort().reduce((t, n) => (t = cr(n, t), Ki(i8[n], t)), e);
}
function $i(i8, e, t = 32) {
  let n = t - e, s = ~((1 << n) - 1);
  return (i8 << e | (s & i8) >>> n) >>> 0;
}
function ar(i8, e = 0, t = i8.byteLength, n = 0) {
  for (let s = 0;s < t; s++)
    i8[e + s] = n;
}
function Os(i8, e, t = "0") {
  for (;i8.length < e; )
    i8 = t + i8;
  return i8;
}
function ht(i8, e = 32) {
  return i8 instanceof ArrayBuffer ? Array.from(new Uint8Array(i8)).map((t) => t.toString(16).padStart(2, "0")).join("") : Os((i8 >>> 0).toString(16), e / 4);
}
var ai = class ai2 {
  constructor() {
    this._h0 = 1732584193;
    this._h1 = 4023233417;
    this._h2 = 2562383102;
    this._h3 = 271733878;
    this._h4 = 3285377520;
    this._buff = new Uint8Array(67), this._buffDV = new DataView(this._buff.buffer), this._buffLen = 0, this._totalLen = 0, this._leftoverHighSurrogate = 0, this._finished = false;
  }
  update(e) {
    let t = e.length;
    if (t === 0)
      return;
    let n = this._buff, s = this._buffLen, o = this._leftoverHighSurrogate, r, a;
    for (o !== 0 ? (r = o, a = -1, o = 0) : (r = e.charCodeAt(0), a = 0);; ) {
      let l = r;
      if (sr(r))
        if (a + 1 < t) {
          let u = e.charCodeAt(a + 1);
          Gi(u) ? (a++, l = or(r, u)) : l = 65533;
        } else {
          o = r;
          break;
        }
      else
        Gi(r) && (l = 65533);
      if (s = this._push(n, s, l), a++, a < t)
        r = e.charCodeAt(a);
      else
        break;
    }
    this._buffLen = s, this._leftoverHighSurrogate = o;
  }
  _push(e, t, n) {
    return n < 128 ? e[t++] = n : n < 2048 ? (e[t++] = 192 | (n & 1984) >>> 6, e[t++] = 128 | (n & 63) >>> 0) : n < 65536 ? (e[t++] = 224 | (n & 61440) >>> 12, e[t++] = 128 | (n & 4032) >>> 6, e[t++] = 128 | (n & 63) >>> 0) : (e[t++] = 240 | (n & 1835008) >>> 18, e[t++] = 128 | (n & 258048) >>> 12, e[t++] = 128 | (n & 4032) >>> 6, e[t++] = 128 | (n & 63) >>> 0), t >= 64 && (this._step(), t -= 64, this._totalLen += 64, e[0] = e[64], e[1] = e[65], e[2] = e[66]), t;
  }
  digest() {
    return this._finished || (this._finished = true, this._leftoverHighSurrogate && (this._leftoverHighSurrogate = 0, this._buffLen = this._push(this._buff, this._buffLen, 65533)), this._totalLen += this._buffLen, this._wrapUp()), ht(this._h0) + ht(this._h1) + ht(this._h2) + ht(this._h3) + ht(this._h4);
  }
  _wrapUp() {
    this._buff[this._buffLen++] = 128, ar(this._buff, this._buffLen), this._buffLen > 56 && (this._step(), ar(this._buff));
    let e = 8 * this._totalLen;
    this._buffDV.setUint32(56, Math.floor(e / 4294967296), false), this._buffDV.setUint32(60, e % 4294967296, false), this._step();
  }
  _step() {
    let e = ai2._bigBlock32, t = this._buffDV;
    for (let d = 0;d < 64; d += 4)
      e.setUint32(d, t.getUint32(d, false), false);
    for (let d = 64;d < 320; d += 4)
      e.setUint32(d, $i(e.getUint32(d - 12, false) ^ e.getUint32(d - 32, false) ^ e.getUint32(d - 56, false) ^ e.getUint32(d - 64, false), 1), false);
    let n = this._h0, s = this._h1, o = this._h2, r = this._h3, a = this._h4, l, u, c;
    for (let d = 0;d < 80; d++)
      d < 20 ? (l = s & o | ~s & r, u = 1518500249) : d < 40 ? (l = s ^ o ^ r, u = 1859775393) : d < 60 ? (l = s & o | s & r | o & r, u = 2400959708) : (l = s ^ o ^ r, u = 3395469782), c = $i(n, 5) + l + a + u + e.getUint32(d * 4, false) & 4294967295, a = r, r = o, o = $i(s, 30), s = n, n = c;
    this._h0 = this._h0 + n & 4294967295, this._h1 = this._h1 + s & 4294967295, this._h2 = this._h2 + o & 4294967295, this._h3 = this._h3 + r & 4294967295, this._h4 = this._h4 + a & 4294967295;
  }
};
ai._bigBlock32 = new DataView(new ArrayBuffer(320));
var { registerWindow: fu, getWindow: Fs, getDocument: mu, getWindows: _u, getWindowsCount: bu, getWindowId: dr, getWindowById: vu, hasWindow: Tu, onDidRegisterWindow: gu, onWillUnregisterWindow: xu, onDidUnregisterWindow: Eu } = function() {
  let i8 = new Map;
  let e = { window: te, disposables: new fe };
  i8.set(te.vscodeWindowId, e);
  let t = new D, n = new D, s = new D;
  function o(r, a) {
    return (typeof r == "number" ? i8.get(r) : undefined) ?? (a ? e : undefined);
  }
  return { onDidRegisterWindow: t.event, onWillUnregisterWindow: s.event, onDidUnregisterWindow: n.event, registerWindow(r) {
    if (i8.has(r.vscodeWindowId))
      return B.None;
    let a = new fe, l = { window: r, disposables: a.add(new fe) };
    return i8.set(r.vscodeWindowId, l), a.add(O(() => {
      i8.delete(r.vscodeWindowId), n.fire(r);
    })), a.add(li(r, Ps.BEFORE_UNLOAD, () => {
      s.fire(r);
    })), t.fire(l), a;
  }, getWindows() {
    return i8.values();
  }, getWindowsCount() {
    return i8.size;
  }, getWindowId(r) {
    return r.vscodeWindowId;
  }, hasWindow(r) {
    return i8.has(r);
  }, getWindowById: o, getWindow(r) {
    let a = r;
    if (a?.ownerDocument?.defaultView)
      return a.ownerDocument.defaultView.window;
    let l = r;
    return l?.view ? l.view.window : te;
  }, getDocument(r) {
    return Fs(r).document;
  } };
}();
var Vi = class {
  constructor(e, t, n, s) {
    this._node = e, this._type = t, this._handler = n, this._options = s || false, this._node.addEventListener(this._type, this._handler, this._options);
  }
  dispose() {
    this._handler && (this._node.removeEventListener(this._type, this._handler, this._options), this._node = null, this._handler = null);
  }
};
function li(i8, e, t, n) {
  return new Vi(i8, e, t, n);
}
var ks;
var hr;
var pt = class {
  constructor(e, t = 0) {
    this._runner = e, this.priority = t, this._canceled = false;
  }
  dispose() {
    this._canceled = true;
  }
  execute() {
    if (!this._canceled)
      try {
        this._runner();
      } catch (e) {
        Pe(e);
      }
  }
  static sort(e, t) {
    return t.priority - e.priority;
  }
};
(function() {
  let i8 = new Map, e = new Map, t = new Map, n = new Map, s = (o) => {
    t.set(o, false);
    let r = i8.get(o) ?? [];
    for (e.set(o, r), i8.set(o, []), n.set(o, true);r.length > 0; )
      r.sort(pt.sort), r.shift().execute();
    n.set(o, false);
  };
  hr = (o, r, a = 0) => {
    let l = dr(o), u = new pt(r, a), c = i8.get(l);
    return c || (c = [], i8.set(l, c)), c.push(u), t.get(l) || (t.set(l, true), o.requestAnimationFrame(() => s(l))), u;
  }, ks = (o, r, a) => {
    let l = dr(o);
    if (n.get(l)) {
      let u = new pt(r, a), c = e.get(l);
      return c || (c = [], e.set(l, c)), c.push(u), u;
    } else
      return hr(o, r, a);
  };
})();
var ke = class ke2 {
  constructor(e, t) {
    this.width = e;
    this.height = t;
  }
  with(e = this.width, t = this.height) {
    return e !== this.width || t !== this.height ? new ke2(e, t) : this;
  }
  static is(e) {
    return typeof e == "object" && typeof e.height == "number" && typeof e.width == "number";
  }
  static lift(e) {
    return e instanceof ke2 ? e : new ke2(e.width, e.height);
  }
  static equals(e, t) {
    return e === t ? true : !e || !t ? false : e.width === t.width && e.height === t.height;
  }
};
ke.None = new ke(0, 0);
var yu = new class {
  constructor() {
    this.mutationObservers = new Map;
  }
  observe(i8, e, t) {
    let n = this.mutationObservers.get(i8);
    n || (n = new Map, this.mutationObservers.set(i8, n));
    let s = ur(t), o = n.get(s);
    if (o)
      o.users += 1;
    else {
      let r = new D, a = new MutationObserver((u) => r.fire(u));
      a.observe(i8, t);
      let l = o = { users: 1, observer: a, onDidMutate: r.event };
      e.add(O(() => {
        l.users -= 1, l.users === 0 && (r.dispose(), a.disconnect(), n?.delete(s), n?.size === 0 && this.mutationObservers.delete(i8));
      })), n.set(s, o);
    }
    return o.onDidMutate;
  }
};
var Ps = { CLICK: "click", AUXCLICK: "auxclick", DBLCLICK: "dblclick", MOUSE_UP: "mouseup", MOUSE_DOWN: "mousedown", MOUSE_OVER: "mouseover", MOUSE_MOVE: "mousemove", MOUSE_OUT: "mouseout", MOUSE_ENTER: "mouseenter", MOUSE_LEAVE: "mouseleave", MOUSE_WHEEL: "wheel", POINTER_UP: "pointerup", POINTER_DOWN: "pointerdown", POINTER_MOVE: "pointermove", POINTER_LEAVE: "pointerleave", CONTEXT_MENU: "contextmenu", WHEEL: "wheel", KEY_DOWN: "keydown", KEY_PRESS: "keypress", KEY_UP: "keyup", LOAD: "load", BEFORE_UNLOAD: "beforeunload", UNLOAD: "unload", PAGE_SHOW: "pageshow", PAGE_HIDE: "pagehide", PASTE: "paste", ABORT: "abort", ERROR: "error", RESIZE: "resize", SCROLL: "scroll", FULLSCREEN_CHANGE: "fullscreenchange", WK_FULLSCREEN_CHANGE: "webkitfullscreenchange", SELECT: "select", CHANGE: "change", SUBMIT: "submit", RESET: "reset", FOCUS: "focus", FOCUS_IN: "focusin", FOCUS_OUT: "focusout", BLUR: "blur", INPUT: "input", STORAGE: "storage", DRAG_START: "dragstart", DRAG: "drag", DRAG_ENTER: "dragenter", DRAG_LEAVE: "dragleave", DRAG_OVER: "dragover", DROP: "drop", DRAG_END: "dragend", ANIMATION_START: ut ? "webkitAnimationStart" : "animationstart", ANIMATION_END: ut ? "webkitAnimationEnd" : "animationend", ANIMATION_ITERATION: ut ? "webkitAnimationIteration" : "animationiteration" };
var Bs = /([\w\-]+)?(#([\w\-]+))?((\.([\w\-]+))*)/;
function fr(i8, e, t, ...n) {
  let s = Bs.exec(e);
  if (!s)
    throw new Error("Bad use of emmet");
  let o = s[1] || "div", r;
  return i8 !== "http://www.w3.org/1999/xhtml" ? r = document.createElementNS(i8, o) : r = document.createElement(o), s[3] && (r.id = s[3]), s[4] && (r.className = s[4].replace(/\./g, " ").trim()), t && Object.entries(t).forEach(([a, l]) => {
    typeof l > "u" || (/^on\w+$/.test(a) ? r[a] = l : a === "selected" ? l && r.setAttribute(a, "true") : r.setAttribute(a, l));
  }), r.append(...n), r;
}
function Ns(i8, e, ...t) {
  return fr("http://www.w3.org/1999/xhtml", i8, e, ...t);
}
Ns.SVG = function(i8, e, ...t) {
  return fr("http://www.w3.org/2000/svg", i8, e, ...t);
};
var ui = class extends B {
  constructor(t, n, s, o, r, a, l, u, c) {
    super();
    this._terminal = t;
    this._characterJoinerService = n;
    this._charSizeService = s;
    this._coreBrowserService = o;
    this._coreService = r;
    this._decorationService = a;
    this._optionsService = l;
    this._themeService = u;
    this._cursorBlinkStateManager = new be;
    this._charAtlasDisposable = this._register(new be);
    this._observerDisposable = this._register(new be);
    this._model = new Vt;
    this._workCell = new at;
    this._workCell2 = new at;
    this._rectangleRenderer = this._register(new be);
    this._glyphRenderer = this._register(new be);
    this._onChangeTextureAtlas = this._register(new D);
    this.onChangeTextureAtlas = this._onChangeTextureAtlas.event;
    this._onAddTextureAtlasCanvas = this._register(new D);
    this.onAddTextureAtlasCanvas = this._onAddTextureAtlasCanvas.event;
    this._onRemoveTextureAtlasCanvas = this._register(new D);
    this.onRemoveTextureAtlasCanvas = this._onRemoveTextureAtlasCanvas.event;
    this._onRequestRedraw = this._register(new D);
    this.onRequestRedraw = this._onRequestRedraw.event;
    this._onContextLoss = this._register(new D);
    this.onContextLoss = this._onContextLoss.event;
    this._canvas = this._coreBrowserService.mainDocument.createElement("canvas");
    let d = { antialias: false, depth: false, preserveDrawingBuffer: c };
    if (this._gl = this._canvas.getContext("webgl2", d), !this._gl)
      throw new Error("WebGL2 not supported " + this._gl);
    this._register(this._themeService.onChangeColors(() => this._handleColorChange())), this._cellColorResolver = new At(this._terminal, this._optionsService, this._model.selection, this._decorationService, this._coreBrowserService, this._themeService), this._core = this._terminal._core, this._renderLayers = [new Xt(this._core.screenElement, 2, this._terminal, this._core.linkifier, this._coreBrowserService, l, this._themeService)], this.dimensions = _n(), this._devicePixelRatio = this._coreBrowserService.dpr, this._updateDimensions(), this._updateCursorBlink(), this._register(l.onOptionChange(() => this._handleOptionsChanged())), this._deviceMaxTextureSize = this._gl.getParameter(this._gl.MAX_TEXTURE_SIZE), this._register(li(this._canvas, "webglcontextlost", (h) => {
      console.log("webglcontextlost event received"), h.preventDefault(), this._contextRestorationTimeout = setTimeout(() => {
        this._contextRestorationTimeout = undefined, console.warn("webgl context not restored; firing onContextLoss"), this._onContextLoss.fire(h);
      }, 3000);
    })), this._register(li(this._canvas, "webglcontextrestored", (h) => {
      console.warn("webglcontextrestored event received"), clearTimeout(this._contextRestorationTimeout), this._contextRestorationTimeout = undefined, Ai(this._terminal), this._initializeWebGLState(), this._requestRedrawViewport();
    })), this._observerDisposable.value = Si(this._canvas, this._coreBrowserService.window, (h, f) => this._setCanvasDevicePixelDimensions(h, f)), this._register(this._coreBrowserService.onWindowChange((h) => {
      this._observerDisposable.value = Si(this._canvas, h, (f, I) => this._setCanvasDevicePixelDimensions(f, I));
    })), this._core.screenElement.appendChild(this._canvas), [this._rectangleRenderer.value, this._glyphRenderer.value] = this._initializeWebGLState(), this._isAttached = this._core.screenElement.isConnected, this._register(O(() => {
      for (let h of this._renderLayers)
        h.dispose();
      this._canvas.parentElement?.removeChild(this._canvas), Ai(this._terminal);
    }));
  }
  get textureAtlas() {
    return this._charAtlas?.pages[0].canvas;
  }
  _handleColorChange() {
    this._refreshCharAtlas(), this._clearModel(true);
  }
  handleDevicePixelRatioChange() {
    this._devicePixelRatio !== this._coreBrowserService.dpr && (this._devicePixelRatio = this._coreBrowserService.dpr, this.handleResize(this._terminal.cols, this._terminal.rows));
  }
  handleResize(t, n) {
    this._updateDimensions(), this._model.resize(this._terminal.cols, this._terminal.rows);
    for (let s of this._renderLayers)
      s.resize(this._terminal, this.dimensions);
    this._canvas.width = this.dimensions.device.canvas.width, this._canvas.height = this.dimensions.device.canvas.height, this._canvas.style.width = `${this.dimensions.css.canvas.width}px`, this._canvas.style.height = `${this.dimensions.css.canvas.height}px`, this._core.screenElement.style.width = `${this.dimensions.css.canvas.width}px`, this._core.screenElement.style.height = `${this.dimensions.css.canvas.height}px`, this._rectangleRenderer.value?.setDimensions(this.dimensions), this._rectangleRenderer.value?.handleResize(), this._glyphRenderer.value?.setDimensions(this.dimensions), this._glyphRenderer.value?.handleResize(), this._refreshCharAtlas(), this._clearModel(false);
  }
  handleCharSizeChanged() {
    this.handleResize(this._terminal.cols, this._terminal.rows);
  }
  handleBlur() {
    for (let t of this._renderLayers)
      t.handleBlur(this._terminal);
    this._cursorBlinkStateManager.value?.pause(), this._requestRedrawViewport();
  }
  handleFocus() {
    for (let t of this._renderLayers)
      t.handleFocus(this._terminal);
    this._cursorBlinkStateManager.value?.resume(), this._requestRedrawViewport();
  }
  handleSelectionChanged(t, n, s) {
    for (let o of this._renderLayers)
      o.handleSelectionChanged(this._terminal, t, n, s);
    this._model.selection.update(this._core, t, n, s), this._requestRedrawViewport();
  }
  handleCursorMove() {
    for (let t of this._renderLayers)
      t.handleCursorMove(this._terminal);
    this._cursorBlinkStateManager.value?.restartBlinkAnimation();
  }
  _handleOptionsChanged() {
    this._updateDimensions(), this._refreshCharAtlas(), this._updateCursorBlink();
  }
  _initializeWebGLState() {
    return this._rectangleRenderer.value = new qt(this._terminal, this._gl, this.dimensions, this._themeService), this._glyphRenderer.value = new Kt(this._terminal, this._gl, this.dimensions, this._optionsService), this.handleCharSizeChanged(), [this._rectangleRenderer.value, this._glyphRenderer.value];
  }
  _refreshCharAtlas() {
    if (this.dimensions.device.char.width <= 0 && this.dimensions.device.char.height <= 0) {
      this._isAttached = false;
      return;
    }
    let t = Nt(this._terminal, this._optionsService.rawOptions, this._themeService.colors, this.dimensions.device.cell.width, this.dimensions.device.cell.height, this.dimensions.device.char.width, this.dimensions.device.char.height, this._coreBrowserService.dpr, this._deviceMaxTextureSize);
    this._charAtlas !== t && (this._onChangeTextureAtlas.fire(t.pages[0].canvas), this._charAtlasDisposable.value = It(ee.forward(t.onAddTextureAtlasCanvas, this._onAddTextureAtlasCanvas), ee.forward(t.onRemoveTextureAtlasCanvas, this._onRemoveTextureAtlasCanvas))), this._charAtlas = t, this._charAtlas.warmUp(), this._glyphRenderer.value?.setAtlas(this._charAtlas);
  }
  _clearModel(t) {
    this._model.clear(), t && this._glyphRenderer.value?.clear();
  }
  clearTextureAtlas() {
    this._charAtlas?.clearTexture(), this._clearModel(true), this._requestRedrawViewport();
  }
  clear() {
    this._clearModel(true);
    for (let t of this._renderLayers)
      t.reset(this._terminal);
    this._cursorBlinkStateManager.value?.restartBlinkAnimation(), this._updateCursorBlink();
  }
  renderRows(t, n) {
    if (!this._isAttached)
      if (this._core.screenElement?.isConnected && this._charSizeService.width && this._charSizeService.height)
        this._updateDimensions(), this._refreshCharAtlas(), this._isAttached = true;
      else
        return;
    for (let s of this._renderLayers)
      s.handleGridChanged(this._terminal, t, n);
    !this._glyphRenderer.value || !this._rectangleRenderer.value || (this._glyphRenderer.value.beginFrame() ? (this._clearModel(true), this._updateModel(0, this._terminal.rows - 1)) : this._updateModel(t, n), this._rectangleRenderer.value.renderBackgrounds(), this._glyphRenderer.value.render(this._model), (!this._cursorBlinkStateManager.value || this._cursorBlinkStateManager.value.isCursorVisible) && this._rectangleRenderer.value.renderCursor());
  }
  _updateCursorBlink() {
    this._coreService.decPrivateModes.cursorBlink ?? this._terminal.options.cursorBlink ? this._cursorBlinkStateManager.value = new Ht(() => {
      this._requestRedrawCursor();
    }, this._coreBrowserService) : this._cursorBlinkStateManager.clear(), this._requestRedrawCursor();
  }
  _updateModel(t, n) {
    let s = this._core, o = this._workCell, r, a, l, u, c, d, h = 0, f = true, I, L, M, q, S, W, E, y, w;
    t = mr(t, s.rows - 1, 0), n = mr(n, s.rows - 1, 0);
    let G = this._coreService.decPrivateModes.cursorStyle ?? s.options.cursorStyle ?? "block", ue = this._terminal.buffer.active.baseY + this._terminal.buffer.active.cursorY, Se = ue - s.buffer.ydisp, ce = Math.min(this._terminal.buffer.active.cursorX, s.cols - 1), we = -1, A = this._coreService.isCursorInitialized && !this._coreService.isCursorHidden && (!this._cursorBlinkStateManager.value || this._cursorBlinkStateManager.value.isCursorVisible);
    this._model.cursor = undefined;
    let se = false;
    for (a = t;a <= n; a++)
      for (l = a + s.buffer.ydisp, u = s.buffer.lines.get(l), this._model.lineLengths[a] = 0, M = ue === l, h = 0, c = this._characterJoinerService.getJoinedCharacters(l), y = 0;y < s.cols; y++) {
        if (r = this._cellColorResolver.result.bg, u.loadCell(y, o), y === 0 && (r = this._cellColorResolver.result.bg), d = false, f = y >= h, I = y, c.length > 0 && y === c[0][0] && f) {
          L = c.shift();
          let v = this._model.selection.isCellSelected(this._terminal, L[0], l);
          for (E = L[0] + 1;E < L[1]; E++)
            f &&= v === this._model.selection.isCellSelected(this._terminal, E, l);
          f &&= !M || ce < L[0] || ce >= L[1], f ? (d = true, o = new Ci(o, u.translateToString(true, L[0], L[1]), L[1] - L[0]), I = L[1] - 1) : h = L[1];
        }
        if (q = o.getChars(), S = o.getCode(), E = (a * s.cols + y) * Ce, this._cellColorResolver.resolve(o, y, l, this.dimensions.device.cell.width), A && l === ue && (y === ce && (this._model.cursor = { x: ce, y: Se, width: o.getWidth(), style: this._coreBrowserService.isFocused ? G : s.options.cursorInactiveStyle, cursorWidth: s.options.cursorWidth, dpr: this._devicePixelRatio }, we = ce + o.getWidth() - 1), y >= ce && y <= we && (this._coreBrowserService.isFocused && G === "block" || this._coreBrowserService.isFocused === false && s.options.cursorInactiveStyle === "block") && (this._cellColorResolver.result.fg = 50331648 | this._themeService.colors.cursorAccent.rgba >> 8 & 16777215, this._cellColorResolver.result.bg = 50331648 | this._themeService.colors.cursor.rgba >> 8 & 16777215)), S !== 0 && (this._model.lineLengths[a] = y + 1), !(this._model.cells[E] === S && this._model.cells[E + ze] === this._cellColorResolver.result.bg && this._model.cells[E + qe] === this._cellColorResolver.result.fg && this._model.cells[E + Ct] === this._cellColorResolver.result.ext) && (se = true, q.length > 1 && (S |= Un), this._model.cells[E] = S, this._model.cells[E + ze] = this._cellColorResolver.result.bg, this._model.cells[E + qe] = this._cellColorResolver.result.fg, this._model.cells[E + Ct] = this._cellColorResolver.result.ext, W = o.getWidth(), this._glyphRenderer.value.updateCell(y, a, S, this._cellColorResolver.result.bg, this._cellColorResolver.result.fg, this._cellColorResolver.result.ext, q, W, r), d)) {
          for (o = this._workCell, y++;y <= I; y++)
            w = (a * s.cols + y) * Ce, this._glyphRenderer.value.updateCell(y, a, 0, 0, 0, 0, pn, 0, 0), this._model.cells[w] = 0, this._model.cells[w + ze] = this._cellColorResolver.result.bg, this._model.cells[w + qe] = this._cellColorResolver.result.fg, this._model.cells[w + Ct] = this._cellColorResolver.result.ext;
          y--;
        }
      }
    se && this._rectangleRenderer.value.updateBackgrounds(this._model), this._rectangleRenderer.value.updateCursor(this._model);
  }
  _updateDimensions() {
    !this._charSizeService.width || !this._charSizeService.height || (this.dimensions.device.char.width = Math.floor(this._charSizeService.width * this._devicePixelRatio), this.dimensions.device.char.height = Math.ceil(this._charSizeService.height * this._devicePixelRatio), this.dimensions.device.cell.height = Math.floor(this.dimensions.device.char.height * this._optionsService.rawOptions.lineHeight), this.dimensions.device.char.top = this._optionsService.rawOptions.lineHeight === 1 ? 0 : Math.round((this.dimensions.device.cell.height - this.dimensions.device.char.height) / 2), this.dimensions.device.cell.width = this.dimensions.device.char.width + Math.round(this._optionsService.rawOptions.letterSpacing), this.dimensions.device.char.left = Math.floor(this._optionsService.rawOptions.letterSpacing / 2), this.dimensions.device.canvas.height = this._terminal.rows * this.dimensions.device.cell.height, this.dimensions.device.canvas.width = this._terminal.cols * this.dimensions.device.cell.width, this.dimensions.css.canvas.height = Math.round(this.dimensions.device.canvas.height / this._devicePixelRatio), this.dimensions.css.canvas.width = Math.round(this.dimensions.device.canvas.width / this._devicePixelRatio), this.dimensions.css.cell.height = this.dimensions.device.cell.height / this._devicePixelRatio, this.dimensions.css.cell.width = this.dimensions.device.cell.width / this._devicePixelRatio);
  }
  _setCanvasDevicePixelDimensions(t, n) {
    this._canvas.width === t && this._canvas.height === n || (this._canvas.width = t, this._canvas.height = n, this._requestRedrawViewport());
  }
  _requestRedrawViewport() {
    this._onRequestRedraw.fire({ start: 0, end: this._terminal.rows - 1 });
  }
  _requestRedrawCursor() {
    let t = this._terminal.buffer.active.cursorY;
    this._onRequestRedraw.fire({ start: t, end: t });
  }
};
var Ci = class extends he {
  constructor(t, n, s) {
    super();
    this.content = 0;
    this.combinedData = "";
    this.fg = t.fg, this.bg = t.bg, this.combinedData = n, this._width = s;
  }
  isCombined() {
    return 2097152;
  }
  getWidth() {
    return this._width;
  }
  getChars() {
    return this.combinedData;
  }
  getCode() {
    return 2097151;
  }
  setFromCharData(t) {
    throw new Error("not implemented");
  }
  getAsCharData() {
    return [this.fg, this.getChars(), this.getWidth(), this.getCode()];
  }
};
function mr(i8, e, t = 0) {
  return Math.max(Math.min(i8, e), t);
}
var _r = "di$target";
var br = "di$dependencies";
var zi = new Map;
function pe(i8) {
  if (zi.has(i8))
    return zi.get(i8);
  let e = function(t, n, s) {
    if (arguments.length !== 3)
      throw new Error("@IServiceName-decorator can only be used to decorate a parameter");
    Us(e, t, s);
  };
  return e._id = i8, zi.set(i8, e), e;
}
function Us(i8, e, t) {
  e[_r] === e ? e[br].push({ id: i8, index: t }) : (e[br] = [{ id: i8, index: t }], e[_r] = e);
}
var Vu = pe("BufferService");
var Cu = pe("CoreMouseService");
var zu = pe("CoreService");
var qu = pe("CharsetService");
var ju = pe("InstantiationService");
var Xu = pe("LogService");
var vr = pe("OptionsService");
var Yu = pe("OscLinkService");
var Qu = pe("UnicodeService");
var Zu = pe("DecorationService");
var Hs = { trace: 0, debug: 1, info: 2, warn: 3, error: 4, off: 5 };
var Ws = "xterm.js: ";
var ci = class extends B {
  constructor(t) {
    super();
    this._optionsService = t;
    this._logLevel = 5;
    this._updateLogLevel(), this._register(this._optionsService.onSpecificOptionChange("logLevel", () => this._updateLogLevel())), Tr = this;
  }
  get logLevel() {
    return this._logLevel;
  }
  _updateLogLevel() {
    this._logLevel = Hs[this._optionsService.rawOptions.logLevel];
  }
  _evalLazyOptionalParams(t) {
    for (let n = 0;n < t.length; n++)
      typeof t[n] == "function" && (t[n] = t[n]());
  }
  _log(t, n, s) {
    this._evalLazyOptionalParams(s), t.call(console, (this._optionsService.options.logger ? "" : Ws) + n, ...s);
  }
  trace(t, ...n) {
    this._logLevel <= 0 && this._log(this._optionsService.options.logger?.trace.bind(this._optionsService.options.logger) ?? console.log, t, n);
  }
  debug(t, ...n) {
    this._logLevel <= 1 && this._log(this._optionsService.options.logger?.debug.bind(this._optionsService.options.logger) ?? console.log, t, n);
  }
  info(t, ...n) {
    this._logLevel <= 2 && this._log(this._optionsService.options.logger?.info.bind(this._optionsService.options.logger) ?? console.info, t, n);
  }
  warn(t, ...n) {
    this._logLevel <= 3 && this._log(this._optionsService.options.logger?.warn.bind(this._optionsService.options.logger) ?? console.warn, t, n);
  }
  error(t, ...n) {
    this._logLevel <= 4 && this._log(this._optionsService.options.logger?.error.bind(this._optionsService.options.logger) ?? console.error, t, n);
  }
};
ci = Yi([Qi(0, vr)], ci);
var Tr;
function gr(i8) {
  Tr = i8;
}
var xr = class extends B {
  constructor(t) {
    if (vi && hn() < 16) {
      let n = { antialias: false, depth: false, preserveDrawingBuffer: true };
      if (!document.createElement("canvas").getContext("webgl2", n))
        throw new Error("Webgl2 is only supported on Safari 16 and above");
    }
    super();
    this._preserveDrawingBuffer = t;
    this._onChangeTextureAtlas = this._register(new D);
    this.onChangeTextureAtlas = this._onChangeTextureAtlas.event;
    this._onAddTextureAtlasCanvas = this._register(new D);
    this.onAddTextureAtlasCanvas = this._onAddTextureAtlasCanvas.event;
    this._onRemoveTextureAtlasCanvas = this._register(new D);
    this.onRemoveTextureAtlasCanvas = this._onRemoveTextureAtlasCanvas.event;
    this._onContextLoss = this._register(new D);
    this.onContextLoss = this._onContextLoss.event;
  }
  activate(t) {
    let n = t._core;
    if (!t.element) {
      this._register(n.onWillOpen(() => this.activate(t)));
      return;
    }
    this._terminal = t;
    let { coreService: s, optionsService: o } = n, r = n, a = r._renderService, l = r._characterJoinerService, u = r._charSizeService, c = r._coreBrowserService, d = r._decorationService, h = r._logService, f = r._themeService;
    gr(h), this._renderer = this._register(new ui(t, l, u, c, s, d, o, f, this._preserveDrawingBuffer)), this._register(ee.forward(this._renderer.onContextLoss, this._onContextLoss)), this._register(ee.forward(this._renderer.onChangeTextureAtlas, this._onChangeTextureAtlas)), this._register(ee.forward(this._renderer.onAddTextureAtlasCanvas, this._onAddTextureAtlasCanvas)), this._register(ee.forward(this._renderer.onRemoveTextureAtlasCanvas, this._onRemoveTextureAtlasCanvas)), a.setRenderer(this._renderer), this._register(O(() => {
      if (this._terminal._core._store._isDisposed)
        return;
      let I = this._terminal._core._renderService;
      I.setRenderer(this._terminal._core._createRenderer()), I.handleResize(t.cols, t.rows);
    }));
  }
  get textureAtlas() {
    return this._renderer?.textureAtlas;
  }
  clearTextureAtlas() {
    this._renderer?.clearTextureAtlas();
  }
};

// node_modules/@xterm/addon-unicode11/lib/addon-unicode11.mjs
var ue = [[768, 879], [1155, 1158], [1160, 1161], [1425, 1469], [1471, 1471], [1473, 1474], [1476, 1477], [1479, 1479], [1536, 1539], [1552, 1557], [1611, 1630], [1648, 1648], [1750, 1764], [1767, 1768], [1770, 1773], [1807, 1807], [1809, 1809], [1840, 1866], [1958, 1968], [2027, 2035], [2305, 2306], [2364, 2364], [2369, 2376], [2381, 2381], [2385, 2388], [2402, 2403], [2433, 2433], [2492, 2492], [2497, 2500], [2509, 2509], [2530, 2531], [2561, 2562], [2620, 2620], [2625, 2626], [2631, 2632], [2635, 2637], [2672, 2673], [2689, 2690], [2748, 2748], [2753, 2757], [2759, 2760], [2765, 2765], [2786, 2787], [2817, 2817], [2876, 2876], [2879, 2879], [2881, 2883], [2893, 2893], [2902, 2902], [2946, 2946], [3008, 3008], [3021, 3021], [3134, 3136], [3142, 3144], [3146, 3149], [3157, 3158], [3260, 3260], [3263, 3263], [3270, 3270], [3276, 3277], [3298, 3299], [3393, 3395], [3405, 3405], [3530, 3530], [3538, 3540], [3542, 3542], [3633, 3633], [3636, 3642], [3655, 3662], [3761, 3761], [3764, 3769], [3771, 3772], [3784, 3789], [3864, 3865], [3893, 3893], [3895, 3895], [3897, 3897], [3953, 3966], [3968, 3972], [3974, 3975], [3984, 3991], [3993, 4028], [4038, 4038], [4141, 4144], [4146, 4146], [4150, 4151], [4153, 4153], [4184, 4185], [4448, 4607], [4959, 4959], [5906, 5908], [5938, 5940], [5970, 5971], [6002, 6003], [6068, 6069], [6071, 6077], [6086, 6086], [6089, 6099], [6109, 6109], [6155, 6157], [6313, 6313], [6432, 6434], [6439, 6440], [6450, 6450], [6457, 6459], [6679, 6680], [6912, 6915], [6964, 6964], [6966, 6970], [6972, 6972], [6978, 6978], [7019, 7027], [7616, 7626], [7678, 7679], [8203, 8207], [8234, 8238], [8288, 8291], [8298, 8303], [8400, 8431], [12330, 12335], [12441, 12442], [43014, 43014], [43019, 43019], [43045, 43046], [64286, 64286], [65024, 65039], [65056, 65059], [65279, 65279], [65529, 65531]];
var qe2 = [[68097, 68099], [68101, 68102], [68108, 68111], [68152, 68154], [68159, 68159], [119143, 119145], [119155, 119170], [119173, 119179], [119210, 119213], [119362, 119364], [917505, 917505], [917536, 917631], [917760, 917999]];
var A;
function He3(r, e) {
  let t = 0, n = e.length - 1, o;
  if (r < e[0][0] || r > e[n][1])
    return false;
  for (;n >= t; )
    if (o = t + n >> 1, r > e[o][1])
      t = o + 1;
    else if (r < e[o][0])
      n = o - 1;
    else
      return true;
  return false;
}
var H2 = class {
  constructor() {
    this.version = "6";
    if (!A) {
      A = new Uint8Array(65536), A.fill(1), A[0] = 0, A.fill(0, 1, 32), A.fill(0, 127, 160), A.fill(2, 4352, 4448), A[9001] = 2, A[9002] = 2, A.fill(2, 11904, 42192), A[12351] = 1, A.fill(2, 44032, 55204), A.fill(2, 63744, 64256), A.fill(2, 65040, 65050), A.fill(2, 65072, 65136), A.fill(2, 65280, 65377), A.fill(2, 65504, 65511);
      for (let e = 0;e < ue.length; ++e)
        A.fill(0, ue[e][0], ue[e][1] + 1);
    }
  }
  wcwidth(e) {
    return e < 32 ? 0 : e < 127 ? 1 : e < 65536 ? A[e] : He3(e, qe2) ? 0 : e >= 131072 && e <= 196605 || e >= 196608 && e <= 262141 ? 2 : 1;
  }
  charProperties(e, t) {
    let n = this.wcwidth(e), o = n === 0 && t !== 0;
    if (o) {
      let d = w.extractWidth(t);
      d === 0 ? o = false : d > n && (n = d);
    }
    return w.createPropertyValue(0, n, o);
  }
};
var de = class {
  constructor() {
    this.listeners = [], this.unexpectedErrorHandler = function(e) {
      setTimeout(() => {
        throw e.stack ? J2.isErrorNoTelemetry(e) ? new J2(e.message + `

` + e.stack) : new Error(e.message + `

` + e.stack) : e;
      }, 0);
    };
  }
  addListener(e) {
    return this.listeners.push(e), () => {
      this._removeListener(e);
    };
  }
  emit(e) {
    this.listeners.forEach((t) => {
      t(e);
    });
  }
  _removeListener(e) {
    this.listeners.splice(this.listeners.indexOf(e), 1);
  }
  setUnexpectedErrorHandler(e) {
    this.unexpectedErrorHandler = e;
  }
  getUnexpectedErrorHandler() {
    return this.unexpectedErrorHandler;
  }
  onUnexpectedError(e) {
    this.unexpectedErrorHandler(e), this.emit(e);
  }
  onUnexpectedExternalError(e) {
    this.unexpectedErrorHandler(e);
  }
};
var Ge2 = new de;
function Y2(r) {
  Je(r) || Ge2.onUnexpectedError(r);
}
var ce = "Canceled";
function Je(r) {
  return r instanceof G ? true : r instanceof Error && r.name === ce && r.message === ce;
}
var G = class extends Error {
  constructor() {
    super(ce), this.name = this.message;
  }
};
var J2 = class r extends Error {
  constructor(e) {
    super(e), this.name = "CodeExpectedError";
  }
  static fromError(e) {
    if (e instanceof r)
      return e;
    let t = new r;
    return t.message = e.message, t.stack = e.stack, t;
  }
  static isErrorNoTelemetry(e) {
    return e.name === "CodeExpectedError";
  }
};
function pe2(r2, e) {
  let t = this, n = false, o;
  return function() {
    if (n)
      return o;
    if (n = true, e)
      try {
        o = r2.apply(t, arguments);
      } finally {
        e();
      }
    else
      o = r2.apply(t, arguments);
    return o;
  };
}
function Ye2(r2, e, t = 0, n = r2.length) {
  let o = t, d = n;
  for (;o < d; ) {
    let v = Math.floor((o + d) / 2);
    e(r2[v]) ? o = v + 1 : d = v;
  }
  return o - 1;
}
var X2 = class X3 {
  constructor(e) {
    this._array = e;
    this._findLastMonotonousLastIdx = 0;
  }
  findLastMonotonous(e) {
    if (X3.assertInvariants) {
      if (this._prevFindLastPredicate) {
        for (let n of this._array)
          if (this._prevFindLastPredicate(n) && !e(n))
            throw new Error("MonotonousArray: current predicate must be weaker than (or equal to) the previous predicate.");
      }
      this._prevFindLastPredicate = e;
    }
    let t = Ye2(this._array, e, this._findLastMonotonousLastIdx);
    return this._findLastMonotonousLastIdx = t + 1, t === -1 ? undefined : this._array[t];
  }
};
X2.assertInvariants = false;
var Be3;
((E) => {
  function r2(p) {
    return p < 0;
  }
  E.isLessThan = r2;
  function e(p) {
    return p <= 0;
  }
  E.isLessThanOrEqual = e;
  function t(p) {
    return p > 0;
  }
  E.isGreaterThan = t;
  function n(p) {
    return p === 0;
  }
  E.isNeitherLessOrGreaterThan = n, E.greaterThan = 1, E.lessThan = -1, E.neitherLessOrGreaterThan = 0;
})(Be3 ||= {});
function we(r2, e) {
  return (t, n) => e(r2(t), r2(n));
}
var ke3 = (r2, e) => r2 - e;
var R = class R2 {
  constructor(e) {
    this.iterate = e;
  }
  forEach(e) {
    this.iterate((t) => (e(t), true));
  }
  toArray() {
    let e = [];
    return this.iterate((t) => (e.push(t), true)), e;
  }
  filter(e) {
    return new R2((t) => this.iterate((n) => e(n) ? t(n) : true));
  }
  map(e) {
    return new R2((t) => this.iterate((n) => t(e(n))));
  }
  some(e) {
    let t = false;
    return this.iterate((n) => (t = e(n), !t)), t;
  }
  findFirst(e) {
    let t;
    return this.iterate((n) => e(n) ? (t = n, false) : true), t;
  }
  findLast(e) {
    let t;
    return this.iterate((n) => (e(n) && (t = n), true)), t;
  }
  findLastMaxBy(e) {
    let t, n = true;
    return this.iterate((o) => ((n || Be3.isGreaterThan(e(o, t))) && (n = false, t = o), true)), t;
  }
};
R.empty = new R((e) => {});
function Oe2(r2, e) {
  let t = Object.create(null);
  for (let n of r2) {
    let o = e(n), d = t[o];
    d || (d = t[o] = []), d.push(n);
  }
  return t;
}
var Se;
var Re;
var Le2 = class {
  constructor(e, t) {
    this.toKey = t;
    this._map = new Map;
    this[Se] = "SetWithKey";
    for (let n of e)
      this.add(n);
  }
  get size() {
    return this._map.size;
  }
  add(e) {
    let t = this.toKey(e);
    return this._map.set(t, e), this;
  }
  delete(e) {
    return this._map.delete(this.toKey(e));
  }
  has(e) {
    return this._map.has(this.toKey(e));
  }
  *entries() {
    for (let e of this._map.values())
      yield [e, e];
  }
  keys() {
    return this.values();
  }
  *values() {
    for (let e of this._map.values())
      yield e;
  }
  clear() {
    this._map.clear();
  }
  forEach(e, t) {
    this._map.forEach((n) => e.call(t, n, n, this));
  }
  [(Re = Symbol.iterator, Se = Symbol.toStringTag, Re)]() {
    return this.values();
  }
};
var Z2 = class {
  constructor() {
    this.map = new Map;
  }
  add(e, t) {
    let n = this.map.get(e);
    n || (n = new Set, this.map.set(e, n)), n.add(t);
  }
  delete(e, t) {
    let n = this.map.get(e);
    n && (n.delete(t), n.size === 0 && this.map.delete(e));
  }
  forEach(e, t) {
    let n = this.map.get(e);
    n && n.forEach(t);
  }
  get(e) {
    let t = this.map.get(e);
    return t || new Set;
  }
};
var fe2;
((le2) => {
  function r2(u) {
    return u && typeof u == "object" && typeof u[Symbol.iterator] == "function";
  }
  le2.is = r2;
  let e = Object.freeze([]);
  function t() {
    return e;
  }
  le2.empty = t;
  function* n(u) {
    yield u;
  }
  le2.single = n;
  function o(u) {
    return r2(u) ? u : n(u);
  }
  le2.wrap = o;
  function d(u) {
    return u || e;
  }
  le2.from = d;
  function* v(u) {
    for (let f = u.length - 1;f >= 0; f--)
      yield u[f];
  }
  le2.reverse = v;
  function E(u) {
    return !u || u[Symbol.iterator]().next().done === true;
  }
  le2.isEmpty = E;
  function p(u) {
    return u[Symbol.iterator]().next().value;
  }
  le2.first = p;
  function b(u, f) {
    let m = 0;
    for (let g of u)
      if (f(g, m++))
        return true;
    return false;
  }
  le2.some = b;
  function D2(u, f) {
    for (let m of u)
      if (f(m))
        return m;
  }
  le2.find = D2;
  function* T(u, f) {
    for (let m of u)
      f(m) && (yield m);
  }
  le2.filter = T;
  function* B2(u, f) {
    let m = 0;
    for (let g of u)
      yield f(g, m++);
  }
  le2.map = B2;
  function* L(u, f) {
    let m = 0;
    for (let g of u)
      yield* f(g, m++);
  }
  le2.flatMap = L;
  function* oe(...u) {
    for (let f of u)
      yield* f;
  }
  le2.concat = oe;
  function z2(u, f, m) {
    let g = m;
    for (let W of u)
      g = f(g, W);
    return g;
  }
  le2.reduce = z2;
  function* k2(u, f, m = u.length) {
    for (f < 0 && (f += u.length), m < 0 ? m += u.length : m > u.length && (m = u.length);f < m; f++)
      yield u[f];
  }
  le2.slice = k2;
  function ae2(u, f = Number.POSITIVE_INFINITY) {
    let m = [];
    if (f === 0)
      return [m, u];
    let g = u[Symbol.iterator]();
    for (let W = 0;W < f; W++) {
      let xe2 = g.next();
      if (xe2.done)
        return [m, le2.empty()];
      m.push(xe2.value);
    }
    return [m, { [Symbol.iterator]() {
      return g;
    } }];
  }
  le2.consume = ae2;
  async function V2(u) {
    let f = [];
    for await (let m of u)
      f.push(m);
    return Promise.resolve(f);
  }
  le2.asyncToArray = V2;
})(fe2 ||= {});
var Xe2 = false;
var O2 = null;
var ee2 = class ee3 {
  constructor() {
    this.livingDisposables = new Map;
  }
  getDisposableData(e) {
    let t = this.livingDisposables.get(e);
    return t || (t = { parent: null, source: null, isSingleton: false, value: e, idx: ee3.idx++ }, this.livingDisposables.set(e, t)), t;
  }
  trackDisposable(e) {
    let t = this.getDisposableData(e);
    t.source || (t.source = new Error().stack);
  }
  setParent(e, t) {
    let n = this.getDisposableData(e);
    n.parent = t;
  }
  markAsDisposed(e) {
    this.livingDisposables.delete(e);
  }
  markAsSingleton(e) {
    this.getDisposableData(e).isSingleton = true;
  }
  getRootParent(e, t) {
    let n = t.get(e);
    if (n)
      return n;
    let o = e.parent ? this.getRootParent(this.getDisposableData(e.parent), t) : e;
    return t.set(e, o), o;
  }
  getTrackedDisposables() {
    let e = new Map;
    return [...this.livingDisposables.entries()].filter(([, n]) => n.source !== null && !this.getRootParent(n, e).isSingleton).flatMap(([n]) => n);
  }
  computeLeakingDisposables(e = 10, t) {
    let n;
    if (t)
      n = t;
    else {
      let p = new Map, b = [...this.livingDisposables.values()].filter((T) => T.source !== null && !this.getRootParent(T, p).isSingleton);
      if (b.length === 0)
        return;
      let D2 = new Set(b.map((T) => T.value));
      if (n = b.filter((T) => !(T.parent && D2.has(T.parent))), n.length === 0)
        throw new Error("There are cyclic diposable chains!");
    }
    if (!n)
      return;
    function o(p) {
      function b(T, B2) {
        for (;T.length > 0 && B2.some((L) => typeof L == "string" ? L === T[0] : T[0].match(L)); )
          T.shift();
      }
      let D2 = p.source.split(`
`).map((T) => T.trim().replace("at ", "")).filter((T) => T !== "");
      return b(D2, ["Error", /^trackDisposable \(.*\)$/, /^DisposableTracker.trackDisposable \(.*\)$/]), D2.reverse();
    }
    let d = new Z2;
    for (let p of n) {
      let b = o(p);
      for (let D2 = 0;D2 <= b.length; D2++)
        d.add(b.slice(0, D2).join(`
`), p);
    }
    n.sort(we((p) => p.idx, ke3));
    let v = "", E = 0;
    for (let p of n.slice(0, e)) {
      E++;
      let b = o(p), D2 = [];
      for (let T = 0;T < b.length; T++) {
        let B2 = b[T];
        B2 = `(shared with ${d.get(b.slice(0, T + 1).join(`
`)).size}/${n.length} leaks) at ${B2}`;
        let oe = d.get(b.slice(0, T).join(`
`)), z2 = Oe2([...oe].map((k2) => o(k2)[T]), (k2) => k2);
        delete z2[b[T]];
        for (let [k2, ae2] of Object.entries(z2))
          D2.unshift(`    - stacktraces of ${ae2.length} other leaks continue with ${k2}`);
        D2.unshift(B2);
      }
      v += `


==================== Leaking disposable ${E}/${n.length}: ${p.value.constructor.name} ====================
${D2.join(`
`)}
============================================================

`;
    }
    return n.length > e && (v += `


... and ${n.length - e} more leaking disposables

`), { leaks: n, details: v };
  }
};
ee2.idx = 0;
function Ze2(r2) {
  O2 = r2;
}
if (Xe2) {
  let r2 = "__is_disposable_tracked__";
  Ze2(new class {
    trackDisposable(e) {
      let t = new Error("Potentially leaked disposable").stack;
      setTimeout(() => {
        e[r2] || console.log(t);
      }, 3000);
    }
    setParent(e, t) {
      if (e && e !== _.None)
        try {
          e[r2] = true;
        } catch {}
    }
    markAsDisposed(e) {
      if (e && e !== _.None)
        try {
          e[r2] = true;
        } catch {}
    }
    markAsSingleton(e) {}
  });
}
function Te2(r2) {
  return O2?.trackDisposable(r2), r2;
}
function ve2(r2) {
  O2?.markAsDisposed(r2);
}
function he2(r2, e) {
  O2?.setParent(r2, e);
}
function et2(r2, e) {
  if (O2)
    for (let t of r2)
      O2.setParent(t, e);
}
function Pe2(r2) {
  if (fe2.is(r2)) {
    let e = [];
    for (let t of r2)
      if (t)
        try {
          t.dispose();
        } catch (n) {
          e.push(n);
        }
    if (e.length === 1)
      throw e[0];
    if (e.length > 1)
      throw new AggregateError(e, "Encountered errors while disposing of store");
    return Array.isArray(r2) ? [] : r2;
  } else if (r2)
    return r2.dispose(), r2;
}
function Me2(...r2) {
  let e = me2(() => Pe2(r2));
  return et2(r2, e), e;
}
function me2(r2) {
  let e = Te2({ dispose: pe2(() => {
    ve2(e), r2();
  }) });
  return e;
}
var te2 = class te3 {
  constructor() {
    this._toDispose = new Set;
    this._isDisposed = false;
    Te2(this);
  }
  dispose() {
    this._isDisposed || (ve2(this), this._isDisposed = true, this.clear());
  }
  get isDisposed() {
    return this._isDisposed;
  }
  clear() {
    if (this._toDispose.size !== 0)
      try {
        Pe2(this._toDispose);
      } finally {
        this._toDispose.clear();
      }
  }
  add(e) {
    if (!e)
      return e;
    if (e === this)
      throw new Error("Cannot register a disposable on itself!");
    return he2(e, this), this._isDisposed ? te3.DISABLE_DISPOSED_WARNING || console.warn(new Error("Trying to add a disposable to a DisposableStore that has already been disposed of. The added object will be leaked!").stack) : this._toDispose.add(e), e;
  }
  delete(e) {
    if (e) {
      if (e === this)
        throw new Error("Cannot dispose a disposable on itself!");
      this._toDispose.delete(e), e.dispose();
    }
  }
  deleteAndLeak(e) {
    e && this._toDispose.has(e) && (this._toDispose.delete(e), he2(e, null));
  }
};
te2.DISABLE_DISPOSED_WARNING = false;
var U2 = te2;
var _ = class {
  constructor() {
    this._store = new U2;
    Te2(this), he2(this._store, this);
  }
  dispose() {
    ve2(this), this._store.dispose();
  }
  _register(e) {
    if (e === this)
      throw new Error("Cannot register a disposable on itself!");
    return this._store.add(e);
  }
};
_.None = Object.freeze({ dispose() {} });
var P = class P2 {
  constructor(e) {
    this.element = e, this.next = P2.Undefined, this.prev = P2.Undefined;
  }
};
P.Undefined = new P(undefined);
var tt2 = globalThis.performance && typeof globalThis.performance.now == "function";
var ne = class r2 {
  static create(e) {
    return new r2(e);
  }
  constructor(e) {
    this._now = tt2 && e === false ? Date.now : globalThis.performance.now.bind(globalThis.performance), this._startTime = this._now(), this._stopTime = -1;
  }
  stop() {
    this._stopTime = this._now();
  }
  reset() {
    this._startTime = this._now(), this._stopTime = -1;
  }
  elapsed() {
    return this._stopTime !== -1 ? this._stopTime - this._startTime : this._now() - this._startTime;
  }
};
var nt2 = false;
var Ve2 = false;
var rt2 = false;
var it2;
((Q3) => {
  Q3.None = () => _.None;
  function e(l) {
    if (rt2) {
      let { onDidAddListener: i8 } = l, a = K2.create(), s = 0;
      l.onDidAddListener = () => {
        ++s === 2 && (console.warn("snapshotted emitter LIKELY used public and SHOULD HAVE BEEN created with DisposableStore. snapshotted here"), a.print()), i8?.();
      };
    }
  }
  function t(l, i8) {
    return B2(l, () => {}, 0, undefined, true, undefined, i8);
  }
  Q3.defer = t;
  function n(l) {
    return (i8, a = null, s) => {
      let x = false, c;
      return c = l((h) => {
        if (!x)
          return c ? c.dispose() : x = true, i8.call(a, h);
      }, null, s), x && c.dispose(), c;
    };
  }
  Q3.once = n;
  function o(l, i8, a) {
    return D2((s, x = null, c) => l((h) => s.call(x, i8(h)), null, c), a);
  }
  Q3.map = o;
  function d(l, i8, a) {
    return D2((s, x = null, c) => l((h) => {
      i8(h), s.call(x, h);
    }, null, c), a);
  }
  Q3.forEach = d;
  function v(l, i8, a) {
    return D2((s, x = null, c) => l((h) => i8(h) && s.call(x, h), null, c), a);
  }
  Q3.filter = v;
  function E(l) {
    return l;
  }
  Q3.signal = E;
  function p(...l) {
    return (i8, a = null, s) => {
      let x = Me2(...l.map((c) => c((h) => i8.call(a, h))));
      return T(x, s);
    };
  }
  Q3.any = p;
  function b(l, i8, a, s) {
    let x = a;
    return o(l, (c) => (x = i8(x, c), x), s);
  }
  Q3.reduce = b;
  function D2(l, i8) {
    let a, s = { onWillAddFirstListener() {
      a = l(x.fire, x);
    }, onDidRemoveLastListener() {
      a?.dispose();
    } };
    i8 || e(s);
    let x = new C2(s);
    return i8?.add(x), x.event;
  }
  function T(l, i8) {
    return i8 instanceof Array ? i8.push(l) : i8 && i8.add(l), l;
  }
  function B2(l, i8, a = 100, s = false, x = false, c, h) {
    let F2, y, S, $ = 0, j2, Ce2 = { leakWarningThreshold: c, onWillAddFirstListener() {
      F2 = l((Qe2) => {
        $++, y = i8(y, Qe2), s && !S && (q.fire(y), y = undefined), j2 = () => {
          let $e = y;
          y = undefined, S = undefined, (!s || $ > 1) && q.fire($e), $ = 0;
        }, typeof a == "number" ? (clearTimeout(S), S = setTimeout(j2, a)) : S === undefined && (S = 0, queueMicrotask(j2));
      });
    }, onWillRemoveListener() {
      x && $ > 0 && j2?.();
    }, onDidRemoveLastListener() {
      j2 = undefined, F2.dispose();
    } };
    h || e(Ce2);
    let q = new C2(Ce2);
    return h?.add(q), q.event;
  }
  Q3.debounce = B2;
  function L(l, i8 = 0, a) {
    return Q3.debounce(l, (s, x) => s ? (s.push(x), s) : [x], i8, undefined, true, undefined, a);
  }
  Q3.accumulate = L;
  function oe(l, i8 = (s, x) => s === x, a) {
    let s = true, x;
    return v(l, (c) => {
      let h = s || !i8(c, x);
      return s = false, x = c, h;
    }, a);
  }
  Q3.latch = oe;
  function z2(l, i8, a) {
    return [Q3.filter(l, i8, a), Q3.filter(l, (s) => !i8(s), a)];
  }
  Q3.split = z2;
  function k2(l, i8 = false, a = [], s) {
    let x = a.slice(), c = l((y) => {
      x ? x.push(y) : F2.fire(y);
    });
    s && s.add(c);
    let h = () => {
      x?.forEach((y) => F2.fire(y)), x = null;
    }, F2 = new C2({ onWillAddFirstListener() {
      c || (c = l((y) => F2.fire(y)), s && s.add(c));
    }, onDidAddFirstListener() {
      x && (i8 ? setTimeout(h) : h());
    }, onDidRemoveLastListener() {
      c && c.dispose(), c = null;
    } });
    return s && s.add(F2), F2.event;
  }
  Q3.buffer = k2;
  function ae2(l, i8) {
    return (s, x, c) => {
      let h = i8(new le2);
      return l(function(F2) {
        let y = h.evaluate(F2);
        y !== V2 && s.call(x, y);
      }, undefined, c);
    };
  }
  Q3.chain = ae2;
  let V2 = Symbol("HaltChainable");

  class le2 {
    constructor() {
      this.steps = [];
    }
    map(i8) {
      return this.steps.push(i8), this;
    }
    forEach(i8) {
      return this.steps.push((a) => (i8(a), a)), this;
    }
    filter(i8) {
      return this.steps.push((a) => i8(a) ? a : V2), this;
    }
    reduce(i8, a) {
      let s = a;
      return this.steps.push((x) => (s = i8(s, x), s)), this;
    }
    latch(i8 = (a, s) => a === s) {
      let a = true, s;
      return this.steps.push((x) => {
        let c = a || !i8(x, s);
        return a = false, s = x, c ? x : V2;
      }), this;
    }
    evaluate(i8) {
      for (let a of this.steps)
        if (i8 = a(i8), i8 === V2)
          break;
      return i8;
    }
  }
  function u(l, i8, a = (s) => s) {
    let s = (...F2) => h.fire(a(...F2)), x = () => l.on(i8, s), c = () => l.removeListener(i8, s), h = new C2({ onWillAddFirstListener: x, onDidRemoveLastListener: c });
    return h.event;
  }
  Q3.fromNodeEventEmitter = u;
  function f(l, i8, a = (s) => s) {
    let s = (...F2) => h.fire(a(...F2)), x = () => l.addEventListener(i8, s), c = () => l.removeEventListener(i8, s), h = new C2({ onWillAddFirstListener: x, onDidRemoveLastListener: c });
    return h.event;
  }
  Q3.fromDOMEventEmitter = f;
  function m(l) {
    return new Promise((i8) => n(l)(i8));
  }
  Q3.toPromise = m;
  function g(l) {
    let i8 = new C2;
    return l.then((a) => {
      i8.fire(a);
    }, () => {
      i8.fire(undefined);
    }).finally(() => {
      i8.dispose();
    }), i8.event;
  }
  Q3.fromPromise = g;
  function W(l, i8) {
    return l((a) => i8.fire(a));
  }
  Q3.forward = W;
  function xe2(l, i8, a) {
    return i8(a), l((s) => i8(s));
  }
  Q3.runAndSubscribe = xe2;

  class ze2 {
    constructor(i8, a) {
      this._observable = i8;
      this._counter = 0;
      this._hasChanged = false;
      let s = { onWillAddFirstListener: () => {
        i8.addObserver(this);
      }, onDidRemoveLastListener: () => {
        i8.removeObserver(this);
      } };
      a || e(s), this.emitter = new C2(s), a && a.add(this.emitter);
    }
    beginUpdate(i8) {
      this._counter++;
    }
    handlePossibleChange(i8) {}
    handleChange(i8, a) {
      this._hasChanged = true;
    }
    endUpdate(i8) {
      this._counter--, this._counter === 0 && (this._observable.reportChanges(), this._hasChanged && (this._hasChanged = false, this.emitter.fire(this._observable.get())));
    }
  }
  function ut2(l, i8) {
    return new ze2(l, i8).emitter.event;
  }
  Q3.fromObservable = ut2;
  function dt2(l) {
    return (i8, a, s) => {
      let x = 0, c = false, h = { beginUpdate() {
        x++;
      }, endUpdate() {
        x--, x === 0 && (l.reportChanges(), c && (c = false, i8.call(a)));
      }, handlePossibleChange() {}, handleChange() {
        c = true;
      } };
      l.addObserver(h), l.reportChanges();
      let F2 = { dispose() {
        l.removeObserver(h);
      } };
      return s instanceof U2 ? s.add(F2) : Array.isArray(s) && s.push(F2), F2;
    };
  }
  Q3.fromObservableLight = dt2;
})(it2 ||= {});
var M = class M2 {
  constructor(e) {
    this.listenerCount = 0;
    this.invocationCount = 0;
    this.elapsedOverall = 0;
    this.durations = [];
    this.name = `${e}_${M2._idPool++}`, M2.all.add(this);
  }
  start(e) {
    this._stopWatch = new ne, this.listenerCount = e;
  }
  stop() {
    if (this._stopWatch) {
      let e = this._stopWatch.elapsed();
      this.durations.push(e), this.elapsedOverall += e, this.invocationCount += 1, this._stopWatch = undefined;
    }
  }
};
M.all = new Set, M._idPool = 0;
var be2 = M;
var We3 = -1;
var ie = class ie2 {
  constructor(e, t, n = (ie2._idPool++).toString(16).padStart(3, "0")) {
    this._errorHandler = e;
    this.threshold = t;
    this.name = n;
    this._warnCountdown = 0;
  }
  dispose() {
    this._stacks?.clear();
  }
  check(e, t) {
    let n = this.threshold;
    if (n <= 0 || t < n)
      return;
    this._stacks || (this._stacks = new Map);
    let o = this._stacks.get(e.value) || 0;
    if (this._stacks.set(e.value, o + 1), this._warnCountdown -= 1, this._warnCountdown <= 0) {
      this._warnCountdown = n * 0.5;
      let [d, v] = this.getMostFrequentStack(), E = `[${this.name}] potential listener LEAK detected, having ${t} listeners already. MOST frequent listener (${v}):`;
      console.warn(E), console.warn(d);
      let p = new De2(E, d);
      this._errorHandler(p);
    }
    return () => {
      let d = this._stacks.get(e.value) || 0;
      this._stacks.set(e.value, d - 1);
    };
  }
  getMostFrequentStack() {
    if (!this._stacks)
      return;
    let e, t = 0;
    for (let [n, o] of this._stacks)
      (!e || t < o) && (e = [n, o], t = o);
    return e;
  }
};
ie._idPool = 1;
var Ee2 = ie;
var K2 = class r3 {
  constructor(e) {
    this.value = e;
  }
  static create() {
    let e = new Error;
    return new r3(e.stack ?? "");
  }
  print() {
    console.warn(this.value.split(`
`).slice(2).join(`
`));
  }
};
var De2 = class extends Error {
  constructor(e, t) {
    super(e), this.name = "ListenerLeakError", this.stack = t;
  }
};
var Ae2 = class extends Error {
  constructor(e, t) {
    super(e), this.name = "ListenerRefusalError", this.stack = t;
  }
};
var st2 = 0;
var N = class {
  constructor(e) {
    this.value = e;
    this.id = st2++;
  }
};
var ot2 = 2;
var at2 = (r4, e) => {
  if (r4 instanceof N)
    e(r4);
  else
    for (let t = 0;t < r4.length; t++) {
      let n = r4[t];
      n && e(n);
    }
};
var re2;
if (nt2) {
  let r4 = [];
  setInterval(() => {
    r4.length !== 0 && (console.warn("[LEAKING LISTENERS] GC'ed these listeners that were NOT yet disposed:"), console.warn(r4.join(`
`)), r4.length = 0);
  }, 3000), re2 = new FinalizationRegistry((e) => {
    typeof e == "string" && r4.push(e);
  });
}
var C2 = class {
  constructor(e) {
    this._size = 0;
    this._options = e, this._leakageMon = We3 > 0 || this._options?.leakWarningThreshold ? new Ee2(e?.onListenerError ?? Y2, this._options?.leakWarningThreshold ?? We3) : undefined, this._perfMon = this._options?._profName ? new be2(this._options._profName) : undefined, this._deliveryQueue = this._options?.deliveryQueue;
  }
  dispose() {
    if (!this._disposed) {
      if (this._disposed = true, this._deliveryQueue?.current === this && this._deliveryQueue.reset(), this._listeners) {
        if (Ve2) {
          let e = this._listeners;
          queueMicrotask(() => {
            at2(e, (t) => t.stack?.print());
          });
        }
        this._listeners = undefined, this._size = 0;
      }
      this._options?.onDidRemoveLastListener?.(), this._leakageMon?.dispose();
    }
  }
  get event() {
    return this._event ??= (e, t, n) => {
      if (this._leakageMon && this._size > this._leakageMon.threshold ** 2) {
        let p = `[${this._leakageMon.name}] REFUSES to accept new listeners because it exceeded its threshold by far (${this._size} vs ${this._leakageMon.threshold})`;
        console.warn(p);
        let b = this._leakageMon.getMostFrequentStack() ?? ["UNKNOWN stack", -1], D2 = new Ae2(`${p}. HINT: Stack shows most frequent listener (${b[1]}-times)`, b[0]);
        return (this._options?.onListenerError || Y2)(D2), _.None;
      }
      if (this._disposed)
        return _.None;
      t && (e = e.bind(t));
      let o = new N(e), d, v;
      this._leakageMon && this._size >= Math.ceil(this._leakageMon.threshold * 0.2) && (o.stack = K2.create(), d = this._leakageMon.check(o.stack, this._size + 1)), Ve2 && (o.stack = v ?? K2.create()), this._listeners ? this._listeners instanceof N ? (this._deliveryQueue ??= new Fe, this._listeners = [this._listeners, o]) : this._listeners.push(o) : (this._options?.onWillAddFirstListener?.(this), this._listeners = o, this._options?.onDidAddFirstListener?.(this)), this._size++;
      let E = me2(() => {
        re2?.unregister(E), d?.(), this._removeListener(o);
      });
      if (n instanceof U2 ? n.add(E) : Array.isArray(n) && n.push(E), re2) {
        let p = new Error().stack.split(`
`).slice(2, 3).join(`
`).trim(), b = /(file:|vscode-file:\/\/vscode-app)?(\/[^:]*:\d+:\d+)/.exec(p);
        re2.register(E, b?.[2] ?? p, E);
      }
      return E;
    }, this._event;
  }
  _removeListener(e) {
    if (this._options?.onWillRemoveListener?.(this), !this._listeners)
      return;
    if (this._size === 1) {
      this._listeners = undefined, this._options?.onDidRemoveLastListener?.(this), this._size = 0;
      return;
    }
    let t = this._listeners, n = t.indexOf(e);
    if (n === -1)
      throw console.log("disposed?", this._disposed), console.log("size?", this._size), console.log("arr?", JSON.stringify(this._listeners)), new Error("Attempted to dispose unknown listener");
    this._size--, t[n] = undefined;
    let o = this._deliveryQueue.current === this;
    if (this._size * ot2 <= t.length) {
      let d = 0;
      for (let v = 0;v < t.length; v++)
        t[v] ? t[d++] = t[v] : o && (this._deliveryQueue.end--, d < this._deliveryQueue.i && this._deliveryQueue.i--);
      t.length = d;
    }
  }
  _deliver(e, t) {
    if (!e)
      return;
    let n = this._options?.onListenerError || Y2;
    if (!n) {
      e.value(t);
      return;
    }
    try {
      e.value(t);
    } catch (o) {
      n(o);
    }
  }
  _deliverQueue(e) {
    let t = e.current._listeners;
    for (;e.i < e.end; )
      this._deliver(t[e.i++], e.value);
    e.reset();
  }
  fire(e) {
    if (this._deliveryQueue?.current && (this._deliverQueue(this._deliveryQueue), this._perfMon?.stop()), this._perfMon?.start(this._size), this._listeners)
      if (this._listeners instanceof N)
        this._deliver(this._listeners, e);
      else {
        let t = this._deliveryQueue;
        t.enqueue(this, e, this._listeners.length), this._deliverQueue(t);
      }
    this._perfMon?.stop();
  }
  hasListeners() {
    return this._size > 0;
  }
};
var Fe = class {
  constructor() {
    this.i = -1;
    this.end = 0;
  }
  enqueue(e, t, n) {
    this.i = 0, this.end = n, this.current = e, this.value = t;
  }
  reset() {
    this.i = this.end, this.current = undefined, this.value = undefined;
  }
};
var w = class r4 {
  constructor() {
    this._providers = Object.create(null);
    this._active = "";
    this._onChange = new C2;
    this.onChange = this._onChange.event;
    let e = new H2;
    this.register(e), this._active = e.version, this._activeProvider = e;
  }
  static extractShouldJoin(e) {
    return (e & 1) !== 0;
  }
  static extractWidth(e) {
    return e >> 1 & 3;
  }
  static extractCharKind(e) {
    return e >> 3;
  }
  static createPropertyValue(e, t, n = false) {
    return (e & 16777215) << 3 | (t & 3) << 1 | (n ? 1 : 0);
  }
  dispose() {
    this._onChange.dispose();
  }
  get versions() {
    return Object.keys(this._providers);
  }
  get activeVersion() {
    return this._active;
  }
  set activeVersion(e) {
    if (!this._providers[e])
      throw new Error(`unknown Unicode version "${e}"`);
    this._active = e, this._activeProvider = this._providers[e], this._onChange.fire(e);
  }
  register(e) {
    this._providers[e.version] = e;
  }
  wcwidth(e) {
    return this._activeProvider.wcwidth(e);
  }
  getStringCellWidth(e) {
    let t = 0, n = 0, o = e.length;
    for (let d = 0;d < o; ++d) {
      let v = e.charCodeAt(d);
      if (55296 <= v && v <= 56319) {
        if (++d >= o)
          return t + this.wcwidth(v);
        let b = e.charCodeAt(d);
        56320 <= b && b <= 57343 ? v = (v - 55296) * 1024 + b - 56320 + 65536 : t += this.wcwidth(b);
      }
      let E = this.charProperties(v, n), p = r4.extractWidth(E);
      r4.extractShouldJoin(E) && (p -= r4.extractWidth(n)), t += p, n = E;
    }
    return t;
  }
  charProperties(e, t) {
    return this._activeProvider.charProperties(e, t);
  }
};
var ye2 = [[768, 879], [1155, 1161], [1425, 1469], [1471, 1471], [1473, 1474], [1476, 1477], [1479, 1479], [1536, 1541], [1552, 1562], [1564, 1564], [1611, 1631], [1648, 1648], [1750, 1757], [1759, 1764], [1767, 1768], [1770, 1773], [1807, 1807], [1809, 1809], [1840, 1866], [1958, 1968], [2027, 2035], [2045, 2045], [2070, 2073], [2075, 2083], [2085, 2087], [2089, 2093], [2137, 2139], [2259, 2306], [2362, 2362], [2364, 2364], [2369, 2376], [2381, 2381], [2385, 2391], [2402, 2403], [2433, 2433], [2492, 2492], [2497, 2500], [2509, 2509], [2530, 2531], [2558, 2558], [2561, 2562], [2620, 2620], [2625, 2626], [2631, 2632], [2635, 2637], [2641, 2641], [2672, 2673], [2677, 2677], [2689, 2690], [2748, 2748], [2753, 2757], [2759, 2760], [2765, 2765], [2786, 2787], [2810, 2815], [2817, 2817], [2876, 2876], [2879, 2879], [2881, 2884], [2893, 2893], [2902, 2902], [2914, 2915], [2946, 2946], [3008, 3008], [3021, 3021], [3072, 3072], [3076, 3076], [3134, 3136], [3142, 3144], [3146, 3149], [3157, 3158], [3170, 3171], [3201, 3201], [3260, 3260], [3263, 3263], [3270, 3270], [3276, 3277], [3298, 3299], [3328, 3329], [3387, 3388], [3393, 3396], [3405, 3405], [3426, 3427], [3530, 3530], [3538, 3540], [3542, 3542], [3633, 3633], [3636, 3642], [3655, 3662], [3761, 3761], [3764, 3772], [3784, 3789], [3864, 3865], [3893, 3893], [3895, 3895], [3897, 3897], [3953, 3966], [3968, 3972], [3974, 3975], [3981, 3991], [3993, 4028], [4038, 4038], [4141, 4144], [4146, 4151], [4153, 4154], [4157, 4158], [4184, 4185], [4190, 4192], [4209, 4212], [4226, 4226], [4229, 4230], [4237, 4237], [4253, 4253], [4448, 4607], [4957, 4959], [5906, 5908], [5938, 5940], [5970, 5971], [6002, 6003], [6068, 6069], [6071, 6077], [6086, 6086], [6089, 6099], [6109, 6109], [6155, 6158], [6277, 6278], [6313, 6313], [6432, 6434], [6439, 6440], [6450, 6450], [6457, 6459], [6679, 6680], [6683, 6683], [6742, 6742], [6744, 6750], [6752, 6752], [6754, 6754], [6757, 6764], [6771, 6780], [6783, 6783], [6832, 6846], [6912, 6915], [6964, 6964], [6966, 6970], [6972, 6972], [6978, 6978], [7019, 7027], [7040, 7041], [7074, 7077], [7080, 7081], [7083, 7085], [7142, 7142], [7144, 7145], [7149, 7149], [7151, 7153], [7212, 7219], [7222, 7223], [7376, 7378], [7380, 7392], [7394, 7400], [7405, 7405], [7412, 7412], [7416, 7417], [7616, 7673], [7675, 7679], [8203, 8207], [8234, 8238], [8288, 8292], [8294, 8303], [8400, 8432], [11503, 11505], [11647, 11647], [11744, 11775], [12330, 12333], [12441, 12442], [42607, 42610], [42612, 42621], [42654, 42655], [42736, 42737], [43010, 43010], [43014, 43014], [43019, 43019], [43045, 43046], [43204, 43205], [43232, 43249], [43263, 43263], [43302, 43309], [43335, 43345], [43392, 43394], [43443, 43443], [43446, 43449], [43452, 43453], [43493, 43493], [43561, 43566], [43569, 43570], [43573, 43574], [43587, 43587], [43596, 43596], [43644, 43644], [43696, 43696], [43698, 43700], [43703, 43704], [43710, 43711], [43713, 43713], [43756, 43757], [43766, 43766], [44005, 44005], [44008, 44008], [44013, 44013], [64286, 64286], [65024, 65039], [65056, 65071], [65279, 65279], [65529, 65531]];
var lt2 = [[66045, 66045], [66272, 66272], [66422, 66426], [68097, 68099], [68101, 68102], [68108, 68111], [68152, 68154], [68159, 68159], [68325, 68326], [68900, 68903], [69446, 69456], [69633, 69633], [69688, 69702], [69759, 69761], [69811, 69814], [69817, 69818], [69821, 69821], [69837, 69837], [69888, 69890], [69927, 69931], [69933, 69940], [70003, 70003], [70016, 70017], [70070, 70078], [70089, 70092], [70191, 70193], [70196, 70196], [70198, 70199], [70206, 70206], [70367, 70367], [70371, 70378], [70400, 70401], [70459, 70460], [70464, 70464], [70502, 70508], [70512, 70516], [70712, 70719], [70722, 70724], [70726, 70726], [70750, 70750], [70835, 70840], [70842, 70842], [70847, 70848], [70850, 70851], [71090, 71093], [71100, 71101], [71103, 71104], [71132, 71133], [71219, 71226], [71229, 71229], [71231, 71232], [71339, 71339], [71341, 71341], [71344, 71349], [71351, 71351], [71453, 71455], [71458, 71461], [71463, 71467], [71727, 71735], [71737, 71738], [72148, 72151], [72154, 72155], [72160, 72160], [72193, 72202], [72243, 72248], [72251, 72254], [72263, 72263], [72273, 72278], [72281, 72283], [72330, 72342], [72344, 72345], [72752, 72758], [72760, 72765], [72767, 72767], [72850, 72871], [72874, 72880], [72882, 72883], [72885, 72886], [73009, 73014], [73018, 73018], [73020, 73021], [73023, 73029], [73031, 73031], [73104, 73105], [73109, 73109], [73111, 73111], [73459, 73460], [78896, 78904], [92912, 92916], [92976, 92982], [94031, 94031], [94095, 94098], [113821, 113822], [113824, 113827], [119143, 119145], [119155, 119170], [119173, 119179], [119210, 119213], [119362, 119364], [121344, 121398], [121403, 121452], [121461, 121461], [121476, 121476], [121499, 121503], [121505, 121519], [122880, 122886], [122888, 122904], [122907, 122913], [122915, 122916], [122918, 122922], [123184, 123190], [123628, 123631], [125136, 125142], [125252, 125258], [917505, 917505], [917536, 917631], [917760, 917999]];
var ge2 = [[4352, 4447], [8986, 8987], [9001, 9002], [9193, 9196], [9200, 9200], [9203, 9203], [9725, 9726], [9748, 9749], [9800, 9811], [9855, 9855], [9875, 9875], [9889, 9889], [9898, 9899], [9917, 9918], [9924, 9925], [9934, 9934], [9940, 9940], [9962, 9962], [9970, 9971], [9973, 9973], [9978, 9978], [9981, 9981], [9989, 9989], [9994, 9995], [10024, 10024], [10060, 10060], [10062, 10062], [10067, 10069], [10071, 10071], [10133, 10135], [10160, 10160], [10175, 10175], [11035, 11036], [11088, 11088], [11093, 11093], [11904, 11929], [11931, 12019], [12032, 12245], [12272, 12283], [12288, 12329], [12334, 12350], [12353, 12438], [12443, 12543], [12549, 12591], [12593, 12686], [12688, 12730], [12736, 12771], [12784, 12830], [12832, 12871], [12880, 19903], [19968, 42124], [42128, 42182], [43360, 43388], [44032, 55203], [63744, 64255], [65040, 65049], [65072, 65106], [65108, 65126], [65128, 65131], [65281, 65376], [65504, 65510]];
var xt3 = [[94176, 94179], [94208, 100343], [100352, 101106], [110592, 110878], [110928, 110930], [110948, 110951], [110960, 111355], [126980, 126980], [127183, 127183], [127374, 127374], [127377, 127386], [127488, 127490], [127504, 127547], [127552, 127560], [127568, 127569], [127584, 127589], [127744, 127776], [127789, 127797], [127799, 127868], [127870, 127891], [127904, 127946], [127951, 127955], [127968, 127984], [127988, 127988], [127992, 128062], [128064, 128064], [128066, 128252], [128255, 128317], [128331, 128334], [128336, 128359], [128378, 128378], [128405, 128406], [128420, 128420], [128507, 128591], [128640, 128709], [128716, 128716], [128720, 128722], [128725, 128725], [128747, 128748], [128756, 128762], [128992, 129003], [129293, 129393], [129395, 129398], [129402, 129442], [129445, 129450], [129454, 129482], [129485, 129535], [129648, 129651], [129656, 129658], [129664, 129666], [129680, 129685], [131072, 196605], [196608, 262141]];
var I;
function je2(r5, e) {
  let t = 0, n = e.length - 1, o;
  if (r5 < e[0][0] || r5 > e[n][1])
    return false;
  for (;n >= t; )
    if (o = t + n >> 1, r5 > e[o][1])
      t = o + 1;
    else if (r5 < e[o][0])
      n = o - 1;
    else
      return true;
  return false;
}
var se = class {
  constructor() {
    this.version = "11";
    if (!I) {
      I = new Uint8Array(65536), I.fill(1), I[0] = 0, I.fill(0, 1, 32), I.fill(0, 127, 160);
      for (let e = 0;e < ye2.length; ++e)
        I.fill(0, ye2[e][0], ye2[e][1] + 1);
      for (let e = 0;e < ge2.length; ++e)
        I.fill(2, ge2[e][0], ge2[e][1] + 1);
    }
  }
  wcwidth(e) {
    return e < 32 ? 0 : e < 127 ? 1 : e < 65536 ? I[e] : je2(e, lt2) ? 0 : je2(e, xt3) ? 2 : 1;
  }
  charProperties(e, t) {
    let n = this.wcwidth(e), o = n === 0 && t !== 0;
    if (o) {
      let d = w.extractWidth(t);
      d === 0 ? o = false : d > n && (n = d);
    }
    return w.createPropertyValue(0, n, o);
  }
};
var Ke = class {
  activate(e) {
    e.unicode.register(new se);
  }
  dispose() {}
};

// public/main.ts
var ws2 = null;
var sessions = new Map;
var activeSession = null;
var STORAGE_KEYS = {
  sessions: "rust-daemon:session-ids",
  activeSession: "rust-daemon:active-session"
};
function safeGetItem(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}
function safeRemoveItem(key) {
  try {
    localStorage.removeItem(key);
  } catch {}
}
function loadStoredSessionIds() {
  const raw = safeGetItem(STORAGE_KEYS.sessions);
  if (!raw)
    return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed))
      return [];
    return parsed.map((id) => Number(id)).filter((id) => Number.isFinite(id));
  } catch {
    return [];
  }
}
function saveStoredSessionIds(ids) {
  safeSetItem(STORAGE_KEYS.sessions, JSON.stringify(ids));
}
function loadStoredActiveSession() {
  const raw = safeGetItem(STORAGE_KEYS.activeSession);
  if (!raw)
    return null;
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}
function saveStoredActiveSession(id) {
  if (id === null) {
    safeRemoveItem(STORAGE_KEYS.activeSession);
    return;
  }
  safeSetItem(STORAGE_KEYS.activeSession, String(id));
}
var storedSessionIds = new Set(loadStoredSessionIds());
var storedActiveSession = loadStoredActiveSession();
function persistStoredSessionIds() {
  saveStoredSessionIds(Array.from(storedSessionIds));
}
function addStoredSessionId(id) {
  if (!storedSessionIds.has(id)) {
    storedSessionIds.add(id);
    persistStoredSessionIds();
  }
}
function removeStoredSessionId(id) {
  if (storedSessionIds.delete(id)) {
    persistStoredSessionIds();
  }
}
function setStoredActiveSession(id) {
  storedActiveSession = id;
  saveStoredActiveSession(id);
}
var tabsEl = document.getElementById("tabs");
var terminalsEl = document.getElementById("terminals");
var statusEl = document.getElementById("status");
var newTabBtn = document.getElementById("new-tab");
function debounce(fn2, delay) {
  let timer = null;
  return (...args) => {
    if (timer)
      clearTimeout(timer);
    timer = setTimeout(() => fn2(...args), delay);
  };
}
function connect() {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  ws2 = new WebSocket(`${protocol}//${location.host}/ws`);
  ws2.onopen = () => {
    setStatus("Connected");
  };
  ws2.onclose = () => {
    setStatus("Disconnected - Reconnecting...");
    setTimeout(connect, 2000);
  };
  ws2.onerror = () => {
    setStatus("Connection error");
  };
  ws2.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    handleMessage(msg);
  };
}
function send(msg) {
  console.log("[ui] Sending:", msg);
  if (!ws2 || ws2.readyState !== WebSocket.OPEN) {
    console.error("[ui] WebSocket not connected, readyState:", ws2?.readyState);
    return;
  }
  ws2.send(JSON.stringify(msg));
}
function handleMessage(msg) {
  switch (msg.type) {
    case "sessions":
      if (msg.sessions && msg.sessions.length > 0) {
        const availableIds = new Set(msg.sessions.map((s) => s.id));
        let targetIds = [];
        if (storedSessionIds.size > 0) {
          let changed = false;
          for (const id of Array.from(storedSessionIds)) {
            if (!availableIds.has(id)) {
              storedSessionIds.delete(id);
              changed = true;
            }
          }
          if (storedActiveSession !== null && !availableIds.has(storedActiveSession)) {
            setStoredActiveSession(null);
          }
          if (changed) {
            persistStoredSessionIds();
          }
          targetIds = Array.from(storedSessionIds).filter((id) => availableIds.has(id));
        } else {
          targetIds = msg.sessions.map((s) => s.id);
          for (const id of targetIds) {
            storedSessionIds.add(id);
          }
          persistStoredSessionIds();
        }
        for (const id of targetIds) {
          if (!sessions.has(id)) {
            createSessionUI(id);
            send({ type: "attach", session: id });
          }
        }
        if (storedActiveSession !== null && targetIds.includes(storedActiveSession)) {
          switchToSession(storedActiveSession);
        }
      }
      break;
    case "created":
      if (msg.session !== undefined) {
        addStoredSessionId(msg.session);
        setStoredActiveSession(msg.session);
        createSessionUI(msg.session);
        send({ type: "attach", session: msg.session });
        switchToSession(msg.session);
      }
      break;
    case "attached":
      if (msg.session !== undefined) {
        const session = sessions.get(msg.session);
        if (session) {
          if (msg.history) {
            const historyBytes = Uint8Array.from(atob(msg.history), (c) => c.charCodeAt(0));
            session.terminal.write(historyBytes);
          } else if (msg.snapshot) {
            const { rehydrate, content } = msg.snapshot;
            if (rehydrate) {
              session.terminal.write(rehydrate + (content ?? ""));
            } else if (content) {
              session.terminal.write(content);
            }
          }
          sendResize(msg.session, session);
        }
      }
      break;
    case "output":
      if (msg.session !== undefined && msg.data) {
        const session = sessions.get(msg.session);
        if (session) {
          const binary = Uint8Array.from(atob(msg.data), (c) => c.charCodeAt(0));
          session.terminal.write(binary);
        }
      }
      break;
    case "exit":
      if (msg.session !== undefined) {
        const session = sessions.get(msg.session);
        if (session) {
          session.terminal.write(`\r
[Process exited with code ${msg.code}]\r
`);
          session.tabEl.classList.add("opacity-50");
        }
      }
      break;
    case "killed":
      if (msg.session !== undefined) {
        removeSession(msg.session);
      }
      break;
    case "error":
      console.error("Server error:", msg.message);
      setStatus(`Error: ${msg.message}`);
      break;
  }
}
function createSessionUI(id) {
  const container = document.createElement("div");
  container.className = "terminal-container";
  container.id = `terminal-${id}`;
  terminalsEl.appendChild(container);
  const terminal = new import_xterm.Terminal({
    cursorBlink: true,
    fontSize: 14,
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    allowProposedApi: true,
    theme: {
      background: "#1a1a1a",
      foreground: "#d4d4d4",
      cursor: "#d4d4d4"
    }
  });
  const fitAddon = new import_addon_fit.FitAddon;
  terminal.loadAddon(fitAddon);
  const unicode11Addon = new Ke;
  terminal.loadAddon(unicode11Addon);
  terminal.unicode.activeVersion = "11";
  terminal.open(container);
  let webglAddon;
  try {
    webglAddon = new xr;
    webglAddon.onContextLoss(() => {
      webglAddon?.dispose();
      webglAddon = undefined;
    });
    terminal.loadAddon(webglAddon);
  } catch (e) {
    console.warn("WebGL addon failed to load, falling back to canvas renderer", e);
    webglAddon = undefined;
  }
  fitAddon.fit();
  terminal.onData((data) => {
    const encoder = new TextEncoder;
    const bytes = encoder.encode(data);
    const base64 = btoa(String.fromCharCode(...bytes));
    send({
      type: "input",
      session: id,
      data: base64
    });
  });
  const tabEl = document.createElement("div");
  tabEl.className = "flex items-center gap-1 px-3 py-1 rounded cursor-pointer text-sm bg-gray-700 text-gray-300 hover:bg-gray-600";
  tabEl.innerHTML = `
    <span class="tab-title">Terminal ${id}</span>
    <button class="close-btn text-gray-500 hover:text-red-400 ml-1">×</button>
  `;
  tabEl.querySelector(".tab-title").addEventListener("click", () => switchToSession(id));
  tabEl.querySelector(".close-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    send({ type: "kill", session: id });
  });
  tabsEl.appendChild(tabEl);
  const session = { id, terminal, fitAddon, webglAddon, container, tabEl };
  sessions.set(id, session);
  const handleResize = debounce(() => {
    if (activeSession === id && session.container.offsetWidth > 0) {
      fitAddon.fit();
      sendResize(id, session);
    }
  }, 50);
  const resizeObserver = new ResizeObserver(handleResize);
  resizeObserver.observe(container);
  if (sessions.size === 1) {
    switchToSession(id);
  }
  updateStatus();
}
function removeSession(id) {
  const session = sessions.get(id);
  if (!session)
    return;
  removeStoredSessionId(id);
  try {
    session.webglAddon?.dispose();
  } catch (e) {}
  session.terminal.dispose();
  session.container.remove();
  session.tabEl.remove();
  sessions.delete(id);
  if (activeSession === id) {
    const remaining = Array.from(sessions.keys());
    if (remaining.length > 0) {
      switchToSession(remaining[0]);
    } else {
      activeSession = null;
    }
  }
  if (activeSession === null) {
    setStoredActiveSession(null);
  }
  updateStatus();
}
function switchToSession(id) {
  for (const [sessionId, session2] of sessions) {
    session2.container.classList.remove("active");
    session2.tabEl.classList.remove("bg-gray-600", "text-white");
    session2.tabEl.classList.add("bg-gray-700", "text-gray-300");
  }
  const session = sessions.get(id);
  if (session) {
    session.container.classList.add("active");
    session.tabEl.classList.remove("bg-gray-700", "text-gray-300");
    session.tabEl.classList.add("bg-gray-600", "text-white");
    activeSession = id;
    setStoredActiveSession(id);
    setTimeout(() => {
      session.fitAddon.fit();
      session.terminal.focus();
      sendResize(id, session);
    }, 0);
  }
  updateStatus();
}
function sendResize(id, session) {
  const { cols, rows } = session.terminal;
  send({ type: "resize", session: id, cols, rows });
}
function setStatus(text) {
  statusEl.textContent = text;
}
function updateStatus() {
  const count = sessions.size;
  const active = activeSession !== null ? ` | Active: ${activeSession}` : "";
  setStatus(`Sessions: ${count}${active}`);
}
newTabBtn.addEventListener("click", () => {
  console.log("[ui] New tab clicked, sending create...");
  send({ type: "create" });
});
var handleWindowResize = debounce(() => {
  if (activeSession !== null) {
    const session = sessions.get(activeSession);
    if (session && session.container.offsetWidth > 0) {
      session.fitAddon.fit();
      sendResize(activeSession, session);
    }
  }
}, 50);
window.addEventListener("resize", handleWindowResize);
connect();
