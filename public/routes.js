let router = new ReefRouter({
	routes: [
    {
      id: 'home',
      title: 'Home',
      url: '/'
    },
    {
      id: 'households',
      title: 'Households',
      url: '/households'
    },
		{
      id: 'stock',
			title: 'Stock',
			url: '/stock'
		},
		{
      id: 'shop',
			title: 'Shop',
			url: '/shop'
		},
		{
      id: 'about',
			title: 'About',
			url: '/about'
		}
	]
})
