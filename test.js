  var nums = [];
  function countdown(n){
  if(n>0){
    nums.push(countdown(n-1));
    console.log(nums)
    return nums;
  }
}

