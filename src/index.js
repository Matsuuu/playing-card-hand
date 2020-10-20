class PlayingCardHand extends HTMLElement {
    static get attributes() {
        return {
            controlSingleTooltip: 'Control 1',
            controlAllTooltip: 'Control all',
            controlMode: 'all',
            peekable: false,
            flippable: false,
        };
    }

    _initDefaults() {
        const attributes = PlayingCardHand.attributes;
        for (const attrKey in attributes) {
            this[attrKey] = attributes[attrKey];
        }
        this.setAttribute('controlMode', this.controlMode); // Always force this
    }

    constructor() {
        super();
        this.cards = null;
        this._initDefaults();
        this._initEventListeners();

        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(PlayingCardHand.template.content.cloneNode(true));
    }

    connectedCallback() {
        this.render();
        if (!this.peekable && !this.flippable) {
            console.error('Card hand needs to be specified either flippable or peekable');
        }
    }

    _initEventListeners() {
        this.addEventListener('mousedown', this._handleClick.bind(this));
    }

    _getCards() {
        this.cards = this.querySelectorAll('playing-card');
        this.cards.forEach((card) => {
            card.removeAttribute('peekable');
            card.removeAttribute('flippable');
            if (this.peekable) {
                card.setAttribute('hidden', '');
            }
        });
    }

    _handleClick(e) {
        if (!this._targetIsPlayingCard(e.target)) return;

        if (this.controlMode === 'all') {
            this._handleAllModeClick(e);
        } else {
            this._handleSingleModeClick(e);
        }
    }

    _handleSingleModeClick(e) {
        if (this.flippable) {
            e.target.flip();
        }
        if (this.peekable) {
            this.target.peek(e);
        }
    }

    _handleAllModeClick(e) {
        const target = e.target;
        if (this.flippable) {
            if (this._targetIsPlayingCard(target)) {
                const hide = !target.hasAttribute('hidden');
                this.cards.forEach((card) => {
                    if (hide) {
                        card.setAttribute('hidden', '');
                    } else {
                        card.removeAttribute('hidden');
                    }
                });
            }
        }
        if (this.peekable) {
            //TODO: Handle multi card peek somehow. Maybe modify original card so that peek is movement in document, not just `this`
            if (this._targetIsPlayingCard(target)) {
                this.cards.forEach((card) => {
                    card.peek(e);
                });
            }
        }
    }

    _targetIsPlayingCard(target) {
        return target.nodeName === 'PLAYING-CARD';
    }

    changeControlMode(controlMode) {
        this.setAttribute('controlMode', controlMode);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        console.log('Attribute changed ', { name, oldValue, newValue });

        this._assignPropertyFromAttribute(name, newValue);
        this._handleAttributeChange(name, newValue);
        this.render();
    }

    _assignPropertyFromAttribute(attributeName, value) {
        const propertyName = this._getPropertyName(attributeName);
        const isBooleanAttribute = value === '';
        this[propertyName] = isBooleanAttribute ? true : value;
    }

    _getPropertyName(attrName) {
        return Object.keys(PlayingCardHand.attributes).find((key) => key.toLowerCase() == attrName);
    }

    _handleAttributeChange(attributeName, value) {
        if (attributeName === 'peekable') {
            if (this.cards && value != null) this.cards.forEach((card) => card.setAttribute('hidden', ''));
        }
    }

    render() {
        this._initTooltips();
        this._getCards();
    }

    _initTooltips() {
        const singleCardHandler = this.shadowRoot.querySelector('.single-card-handling');
        const allCardHandler = this.shadowRoot.querySelector('.all-card-handling');
        singleCardHandler.dataset.tooltip = this.controlSingleTooltip;
        allCardHandler.dataset.tooltip = this.controlAllTooltip;
        singleCardHandler.addEventListener('click', () => this.changeControlMode('single'));
        allCardHandler.addEventListener('click', () => this.changeControlMode('all'));
    }

    static get observedAttributes() {
        return Object.keys(PlayingCardHand.attributes).map((key) => key.toLowerCase());
    }

    static get template() {
        const template = document.createElement('template');
        template.innerHTML = `
            ${PlayingCardHand.styles}
            <slot></slot>

            <div class="card-handling-selector">
              <div class="single-card-handling card-handling-toggle">
                <div class="mini-card"></div>
              </div>
              <div class="all-card-handling card-handling-toggle">
                ${`<div class="mini-card"></div>`.repeat(4)}
              </div>
            </div>
        `;
        return template;
    }

    static get styles() {
        return `
<style>
  :host {
    --card-seperation-margin: 0.5rem;
    --card-overlap-amount: -1.5;

    display: flex;  
  }

  ::slotted(playing-card:not(:last-child)){
    margin-right: var(--card-seperation-margin);
  }

  :host([overlapping]) ::slotted(playing-card:not(:first-child)) {
    margin-left: calc(var(--card-size) * var(--card-overlap-amount));
  }

  .card-handling-selector {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100px;
    align-self: flex-end;
    align-items: flex-end;
  }

  .mini-card {
    height: 35px;
    width: 20px;
    border-radius: 4px;
    border: 2px solid darkorange;
    background: rgba(0,0,0,0.8);
    cursor: pointer;
  }

  .card-handling-toggle:after {
    content: attr(data-tooltip);
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    left: 110%;
    top: 5px;
    padding: 0.5rem 2rem;
    border-radius: 4px;
    background: #4c4a4a;
    white-space: nowrap;
    color: #FFF;
    transform: scaleX(0);
    transform-origin: left;
    transition: 100ms ease-in-out;
    transition-delay: 0;
  }

  .card-handling-toggle:hover::after {
    transform: scaleX(1);
    transition-delay: 600ms;
  }

  .single-card-handling {
    padding-bottom: 0.2rem;
    height: 50px;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    position: relative;
  }

  :host([controlmode="single"]) .single-card-handling::before,
  :host([controlmode="all"]) .all-card-handling::before
  {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    margin: auto;
    right: -10px;
    width: 5px;
    height: 5px;
    background: black;
  }

  .all-card-handling {
    display: flex;
    height: 50px;
    width: 100%;
    position: relative;
  }

  .all-card-handling .mini-card {
    transform: rotateZ(calc(-80deg + (20deg * var(--mini-card-rotation)))) translate(calc(5.5px * var(--mini-card-rotation)), calc(-1.5px * var(--mini-card-rotation)));
    position: absolute; 
    top: 11px;
    right: 23px;
  }

  .all-card-handling .mini-card:nth-child(1) { --mini-card-rotation: 1; }
  .all-card-handling .mini-card:nth-child(2) { --mini-card-rotation: 2; }
  .all-card-handling .mini-card:nth-child(3) { --mini-card-rotation: 3; }
  .all-card-handling .mini-card:nth-child(4) { --mini-card-rotation: 4; }


</style>
        `;
    }
}

if (!customElements.get('playing-card-hand')) {
    customElements.define('playing-card-hand', PlayingCardHand);
}
