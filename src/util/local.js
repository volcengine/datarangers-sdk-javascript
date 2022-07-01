// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.

const b = (a) => {
    return a ? ( a ^  Math.random() * 16 >> a/4 ).toString(10) : ([1e7] + (-1e3) + (-4e3) + (-8e3) + (-1e11)).replace(/[018]/g,b)
  }
const localWebId = () => {
    return b().replace(/-/g,'').slice(0,19)
}
export default localWebId