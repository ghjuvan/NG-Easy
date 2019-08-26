// typescript official documentation : typescriptlang.org/docs/handbook/decorators.html
// ban-types, callable-types and only-arrow-functions are irrelevant in this context
// tslint:disable:ban-types
// tslint:disable:only-arrow-functions
// tslint:disable:callable-types
// tslint:disable:no-string-literal
// tslint:disable:variable-name

export function Init(value?) {
  return function(target: any, key: string | symbol) {
    target[key] = value || null;
    if (!target.keys) {
      target.keys = [];
    }
    target.keys.push(key);
    Object.defineProperty(target, key, {
      enumerable: true,
    });
  };
}

export function Requestable() {
  return function(target: any, key: string) {
    if (!target.__requestableKeys__) {
      target.__requestableKeys__ = [];
    }
    target.__requestableKeys__.push(key);
  };
}

export function RequiredForRequest() {
  return function(target: any, key: string) {
    if (!target.__requiredKeys__) {
      target.__requiredKeys__ = [];
    }
    target.__requiredKeys__.push(key);
  };
}

export function ValidatorsList(...args) {
  return function(target: any, key: string) {
    target[`__${key}Validators__`] = args;
  };
}

export class Updatable<T> {
  private __excludedKeys__ = ['update', 'getKeys', 'getRequest', 'get', '_getRaw', 'keys', 'requestableKeys', 'requiredKeys'];
  private __keys__: string[];
  private __requestableKeys__: string[];
  private __requiredKeys__: string[];
  private __map__: Map<string, any>;
  private __requiredKeysMap__: Set<string>;

  constructor(data: T) {
    this.update(data);
  }

  update(data): Updatable<T> {
    Object.assign(this['__proto__'], data);
    return this;
  }

  getKeys(): string[] {
    return this.__keys__;
  }

  getKeyValidators(key: string) {
    return this[key + 'Validators'];
  }

  getRequestableKeys(): string[] {
    return this.__requestableKeys__;
  }

  getRequiredKeysSet(): Set<string> {
    if (!this.__requiredKeysMap__) {
      this.__requiredKeysMap__ = new Set(this.__requiredKeys__);
    }
    return this.__requiredKeysMap__;
  }

  getRequest(toSend?: boolean) {
    const buffer = {};
    this.__map__ = new Map(Object.entries(this.get()));
    this.__map__.forEach((value: any, key: string) => {
        if (this.__requestableKeys__.includes(key)) {
          buffer[key] = value;
        }
        if (toSend && this.__requiredKeys__.includes(key) && !value) {
          throw new Error(`missing required field "${key}"`);
        }

      }
    );
    return buffer;
  }

  get(): Updatable<T> {
    return this.cleanKeys(this.__excludedKeys__, {...this['__proto__']});
  }

  getFormBuildObject() {
    const buffer = {};
    this.getRequestableKeys().forEach(key => {
        buffer[key] = [this[key], this[`__${key}Validators__`]];
      }
    );
    return buffer;
  }

  private _runArrayInMap(keys: string[], map: Map<string, any>, f: Function) {
    return map.forEach((value: any, key: string) => {
      if (this.__requestableKeys__.includes(key)) {
        f();
      }
    });
  }

  private _getRaw(): T {
    const copy = new Map(Object.entries(this));
    const buffer = {};
    copy.forEach((value, key) => {
      if (value !== undefined) {
        buffer[key] = value;
      }
    });
    return buffer as T;
  }

  private cleanKeys(keysToExclude: string[], source: any) {
    const buffer = source;
    keysToExclude.forEach(key => {
      delete buffer[key];
    });
    return buffer;
  }
}
