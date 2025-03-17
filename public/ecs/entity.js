let lastEntityId = 0;

/** エンティティを生成 */
export function createEntity() {
  return {
    id: ++lastEntityId,
    components: {}
  };
}

/** エンティティにコンポーネントを追加 */
export function addComponent(entity, component) {
  entity.components[component.name] = component;
}

/** 特定コンポーネントを持っているか判定 */
export function hasComponent(entity, componentName) {
  return !!entity.components[componentName];
}

/** コンポーネントを取得 */
export function getComponent(entity, componentName) {
  return entity.components[componentName];
}
