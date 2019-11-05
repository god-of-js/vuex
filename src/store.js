import Vue from "vue";
import Vuex from "vuex";
import { auth, db } from "@/plugins/firebase/firebaseinit";
Vue.use(Vuex);
auth.onAuthStateChanged(user => {
  //if user exists commit setscurrentUser else  null
  user
    ? (async () => {
      store.commit("setCurrentUser", user);
      store.dispatch("getUserProfile", user.uid);
      store.dispatch("getConvo", user.uid);
      store.dispatch("getMessages", user.uid);
    })()
    : null;
});
const store = new Vuex.Store({
  state: {
    currentUser: null,
    userProfile: null,
    isAdmin: false,
    isSuperAdmin: false,
    studentsCollection: [],
    convo: [],
    all: {},
    allIds: [],
    messages: [],
    usersId: null
  },
  mutations: {
    setCurrentUser: (state, val) => {
      state.currentUser = val;
    },
    setUserProfile(state, val) {
      state.userProfile = val;
    },
    setAdmin(state, val) {
      state.isAdmin = val;
    },
    setSuperAdmin(state, val) {
      state.isSuperAdmin = val;
    },
    setStudentsCollection(state, val) {
      state.studentsCollection = val;
    },
    setConvos(state, val) {
      state.convo.push(val)
    },
    setmessage(state, messages) {
      state.messages = messages
    },
    setuserid(state, userId) {
      state.usersId = userId
    }
  },
  actions: {
    createUserProfile({ commit }, { vueApp, user }) {
      //the students data
      const userData = {
        name: vueApp.lname && vueApp.fname && vueApp.mname,
        fname: vueApp.fname,
        mname: vueApp.mname,
        lname: vueApp.lname,
        mnum: vueApp.mnum,
        dnum: vueApp.dnum,
        address: vueApp.address,
        classi: vueApp.classi,
        fathersName: vueApp.fathersName,
        mothersName: vueApp.mothersName,
        state: vueApp.selectedState,
        gender: vueApp.selectedGender,
        email: vueApp.email,
        userId: user.uid
      };
      //adding to firestore collection creating the gainsville collection
      db.collection("gainsville")
        .doc()
        .set(userData) // passing the user data to firestore
        .then(() => {
          commit("setUserProfile", userData); //commiting user data to the store
          commit("setStudentCollection", userData);
          vueApp.$router.push("/studentdashboard");
        })
        .then(() => {
          const Toast = vueApp.$swal.mixin({
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 3000,
            type: "success",
            title: "Signed in successfully"
          });
          Toast.fire({
            type: "success",
            title: "Successfully logged in"
          });
        });
    },
    adminCheck({ commit }, { vueApp, user }) {
      db.collection("gainsville")
        .where("userId", "==", user.uid)
        .get()
        .then(query => {
          query.forEach(doc => {
            if (doc.data().isAdmin == true) {
              commit("setAdmin", doc.data());
              vueApp.$router.push("/admin");
            } else if (doc.data().isSuperAdmin == true) {
              commit("setSuperAdmin", doc.data());
              vueApp.$router.push("/admin");
            } else vueApp.$router.push("/studentdashboard");
          });
        });
    },
    getUserProfile({ commit }, uid) {
      db.collection("gainsville")
        .where("userId", "==", uid) //checking if the userid is equal to the user id in firestore
        .get()
        .then(query => {
          query.forEach(doc => {
            commit("setCurrentUser", doc.data());
          });
        });
    },
    getStudentCollection({ commit }) {
      const studentArr = [];
      db.collection("gainsville").get()
        .then((snapshot) => {
          snapshot.forEach(doc => {
            studentArr.push(doc.data())
            commit("setStudentsCollection", studentArr)
          })
        })
    },
    async getConvo({ commit, state }, uid) {
      const convo = [];
      let convoRef = state.firestore.collection("messages").where("userId", "==", uid);
      let convos = await convoRef.get();
      convos.forEach(doc => {
        convo.push(doc.data())
      })
      commit('setConvos', convo)

    },
    //get message from firestore
    async getMessages({ commit, state }, uid) {
      const messages = [];
      let convoRef = db.collection("messages").where('id', "==", uid);
      let convos = await convoRef.get();
      convos.forEach(doc => {
        messages.push(doc.data())
      })
      commit('setmessage', messages);
    },
    sendAdminMessages({ state }, { data }) {//send message to firestore
      state.firestore.collection("adminMessages")
        .doc()
        .set(data)
        .catch(err => {
          console.log(err);
        });

    },
   
  }
});
export default store;
