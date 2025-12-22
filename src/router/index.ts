import {createRouter, createWebHistory} from 'vue-router'
import Test from '@/components/Test.vue'

const router = createRouter({
    history:createWebHistory(),
    routes:[
        {
            path:'/home',
            alias:"/",
            component:Test
        }
    ]
})