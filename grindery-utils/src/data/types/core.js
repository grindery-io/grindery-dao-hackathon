export const Meta = {
  Type: 'Meta',
  Definition: [
    {name: 'origin', type: 'string'},
    {name: 'format', type: 'string'},
    {name: 'version', type: 'string'},
    {name: 'updateOf', type: 'string'},
  ],
};

export const Identity = {
  Type: 'Identity',
  Definition: [
    {name: 'address', type: 'address'},
    {name: 'email', type: 'string'},
    {name: 'name', type: 'string'},
    {name: 'reference', type: 'string'},
  ],
};
